matrix.rt.add('promotions_test', async function () {
   m.promotionss_test.promotions();
})
matrix.rt.add('promotions_test/:id', async function (params) {
   if (params.id) m.promotionss_test.promotions(params.id);
});
matrix.rt.add('promotions_test/:id/:draft', async function (params) {
   if (params.draft) m.promotionss_test.promotions(params.id, true);
});

m.promotionss_test = {};
m.promotionss_test.promotions = function (id = false, draft = false) {
   m.clearPage();
   let window_frame = new m.ui._new.window(page.mainpage, {size: {height: "100%"}, header: "Promotions"});
   window_frame.windowSegments.center.getDom().innerHTML = m.templates.rebate_test["promotions.html"] // use catalog name
   let btn_lable = draft ? 'Accept' : 'Save';
   let btn = new m.ui._new.button(window_frame.windowSegments.bottomRight, {size: {width: "auto"}, label: btn_lable});
   btn.on("click", async function () {
      document.getElementById("vue_hidden_btn").click();
   });

   new Vue({
      el: '#vue_matrix_promotions',
      data: {
         params: {
            prevID: id,
            draft: draft,
            prevIDFromDraft: false,
         },
         products: {
            list: [],
            listTemp: [],
         },
         models: {
            name: null,
            selectedProduct: null,
            selectedProductList: [],
            selectedDate: null,
            selectedDateDefault: "2030-01-01",
            selectedRegion: 5,
            mainBannerLink: null,
            miniBannerLink: null,
            landingPageTitle1: null,
            landingPageText1: null,
            landingPageTitle2: null,
            landingPageText2: null,
         },
         optional: {
            createRebate: false,
         },
         visible: {
            productInput: false
         },
         variables: {
            runWatch: true,
            goTo: 'promotions_list',
            goToRebate: 'rebate/false/false/true',
            goToPromoList: 'promotions_list',
         },
         fakeFilesName: {},
         regionList: [],
      },
      methods: {
         mouseOver(evt) {
            document.getElementById(evt.target.id).focus();
         },
         setDayPicker() {
            new Pikaday({
               field: document.getElementById('selectedDate'),
               onSelect: date => {
                  let year = date.getFullYear()
                  let month = date.getMonth() + 1
                  let day = date.getDate()
                  this.models.selectedDate = [year, month < 10 ? '0' + month : month, day < 10 ? '0' + day : day].join('-');
               }
            }).setDate(new Date((!this.params.prevID && !this.params.draft) ? "" : this.models.selectedDate));
         },
         setFakeFileName(evt) {
            this.$set(this.fakeFilesName, evt.target.id, this.$refs[evt.target.id].files[0].name)
         },
         productAdd(item) {
            let separator = false
            if (!item.trim().toString().includes('all') && item.trim().toString().includes(' ')) {
               separator = ' '
            }
            else if (item.trim().toString().includes(',')) {
               separator = ','
            }

            if (separator) {
               let products_array = item.split(separator);
               products_array.forEach(e => {
                  this.products.list.forEach(p => {
                     if (p.value === e) {
                        this.models.selectedProductList.push(e)
                        return false;
                     }
                  })
               })
            }
            else {
               this.products.list.forEach(p => {
                  if (p.value === item) {
                     this.models.selectedProductList.push(item)
                     return false;
                  }
               })
            }
         },
         productRemove(item) {
            this.models.selectedProductList = this.models.selectedProductList.filter(e => e !== item)
         },
         checkErrors() {
            let ready = true;
            let check_list = [
               {err: 'name', errText: 'Empty name'},
               {err: 'selectedProductList', errText: 'Empty products'},
               {err: 'mainBanner', errText: 'Empty banner'},
               {err: 'mainBannerLong', errText: 'Empty banner'},
               {err: 'mainBannerLink', errText: 'Empty banner link'},
               {err: 'miniBanner', errText: 'Empty banner'},
               {err: 'miniBannerLink', errText: 'Empty banner link'},
               {err: 'regulations', errText: 'Empty regulation'},
               {err: 'landingPageTitle1', errText: 'Empty title1'},
               {err: 'landingPageText1', errText: 'Empty text1'},
               {err: 'landingPageTitle2', errText: 'Empty title2'},
               {err: 'landingPageText2', errText: 'Empty text2'},
            ]

            check_list.forEach(e => {
               if ((this.models[e.err] !== undefined && (this.models[e.err] === null || !this.models[e.err].length)) ||
                   (this.$refs[e.err] && !this.fakeFilesName[e.err])) {
                  ready = false;
                  $(`#${e.err}_error`).text(`${e.errText}`);
               }
               else {
                  $(`#${e.err}_error`).text('');
               }
            })

            if (!ready) throw ready;
         },
         checkParamsType() {
            if (isNaN(this.params.prevID)) this.params.prevID = false;

            this.params.draft = this.params.draft.toLocaleString().toLowerCase() === 'true'
         },
         async sendFileToWebPage(file, base64, tries) {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 5000);

            const onError = (err) => {
               let triesLeft = tries - 1;
               if (!triesLeft) {
                  throw err;
               }
               return this.sendFileToWebPage(file, base64, triesLeft)
            }

            return fetch('/php/upload_to_webpage', {
               method: 'POST',
               signal: controller.signal,
               body: "file_name=media/img/promotions/" + file + "&file=" + encodeURIComponent(base64),
               headers: {"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"}
            }).then().catch(err => onError(err))
         },
         async getPrevData() {
            let prevData = {};

            if (this.params.draft) {
               let get_data = await m.api.drafts_new.get({"id": this.params.prevID});

               if (JSON.parse(get_data.collection[0].data).parsed) {
                  prevData = JSON.parse(get_data.collection[0].data).parsed
               }
               else {
                  prevData = JSON.parse(get_data.collection[0].data)[0][3]
                  this.optional.createRebate = true
               }
            }
            else if (this.params.prevID) {
               let get_data = await m.api.promotions.get({"id": this.params.prevID});
               prevData = get_data.collection[0]
            }

            this.variables.runWatch = false;

            if (prevData && Object.keys(prevData).length !== 0) {
               this.models.name = prevData.name
               this.models.landingPageTitle1 = JSON.parse(prevData.text)[0].title1.replaceAll('#', '')
               this.models.landingPageText1 = JSON.parse(prevData.text)[1].text1.replaceAll('#', '')
               this.models.landingPageTitle2 = JSON.parse(prevData.text)[2].title2.replaceAll('#', '')
               this.models.landingPageText2 = JSON.parse(prevData.text)[3].text2.replaceAll('#', '')
               this.models.selectedRegion = prevData.region
               this.fakeFilesName.mainBanner = prevData.big_image.replace('/media/img/promotions/', '')
               this.fakeFilesName.mainBannerLong = prevData.big_image_long.replace('/media/img/promotions/', '')
               this.models.mainBannerLink = prevData.extras.replace('/', '')
               this.fakeFilesName.miniBanner = prevData.small_image.replace('/media/img/promotions/', '')
               this.models.miniBannerLink = prevData.small_image_link.replace('/', '')
               this.fakeFilesName.regulations = prevData.rules_link.replace('/media/img/promotions/', '')
               this.models.selectedDate = prevData.enddate
               this.params.prevIDFromDraft = prevData.id // save id for draft

               await this.getProducts()
               this.productAdd(prevData.items)
            }

            this.variables.runWatch = true;
         },
         async getFileBase64(file) {
            if (file)
               return new Promise((resolve, reject) => {
                  const reader = new FileReader()
                  reader.readAsDataURL(file)
                  reader.onload = () => resolve(
                     reader.result.replace('data:application/pdf;base64,', '').replace('data:image/png;base64,', ''))

                  reader.onerror = error => reject(error)
               })
         },
         async getProducts() {
            this.products.listTemp = this.products.list = [];
            this.products.list.push({value: "all mice", name: "all mice"});
            this.products.list.push({value: "all mousepads", name: "all mousepads"});
            this.products.list.push({value: "all keyboards", name: "all keyboards"});
            this.products.list.push({value: "dm1s2", name: "DM1S2"});
            this.products.list.push({value: "dm2comfys", name: "DM2 Comfy S"});
            this.products.list.push({value: "dm2supreme", name: "DM2 Supreme"});
            this.products.list.push({value: "dm4evo", name: "DM4 Evo"});
            this.products.list.push({value: "dm5blink", name: "DM5 Blink"});
            this.products.list.push({value: "dm6holey", name: "DM6 Holey"});
            this.products.list.push({value: "dm6holeys", name: "DM6 Holey S"});
            this.products.list.push({value: "dm6duo", name: "DM6 Duo"});
            this.products.list.push({value: "dm1fpsblack", name: "DM1 FPS (Black)"});
            this.products.list.push({value: "dm1fpsblue", name: "DM1 FPS (Blue)"});
            this.products.list.push({value: "dm1fpsred", name: "DM1 FPS (Red)"});
            this.products.list.push({value: "dm1fpswhite", name: "DM1 FPS (White)"});
            this.products.list.push({value: "dm1fpswhiteglossy", name: "DM1 FPS Pearl White"});
            this.products.list.push({value: "dm1fpsgray", name: "DM1 FPS Smoke Grey"});
            this.products.list.push({value: "dm1fpsblackglossy", name: "DM1 FPS Onyx Black"});
            this.products.list.push({value: "dm1fpsblackmatte", name: "DM1 FPS Raven Black"});

            let products2021 = await m.api.product2021.get();
            for (let i = 0; i < products2021.collection.length; i++) {
               this.products.list.push({
                  "value": products2021.collection[i].model_name,
                  "name": products2021.collection[i].model_name
               });
            }
            this.products.list.push({value: "all laptops", name: "all laptops"});
            let laptopsReg = await m.api.laptops_new.get({
               "Visible": "1",
               "region_id": this.models.selectedRegion,
               "Type": "Regular",
               "getfields": "id,Model_name"
            })
            for (let i = 0; i < laptopsReg.collection.length; i++) {
               this.products.list.push({"value": laptopsReg.collection[i].model_name, "name": laptopsReg.collection[i].model_name});
            }

            let laptopsPre = await m.api.laptops_new.get({
               "Visible": "1",
               "region_id": this.models.selectedRegion,
               "Type": "Preorder",
               "getfields": "id,Model_name"
            })
            for (let i = 0; i < laptopsPre.collection.length; i++) {
               this.products.list.push({"value": laptopsPre.collection[i].model_name, "name": laptopsPre.collection[i].model_name});
            }

            this.products.listTemp = this.products.list
         },
         async getRegions() {
            let regions = await m.api.regions.get();
            this.regionList = regions.collection;
         },
         async prepareDataToPost() {
            try {
               let globalErr = $('#global_error');
               globalErr.text('')
               for (let ref in this.$refs) {
                  globalErr.text('Please wait. Send files to WebPage.');
                  if (this.$refs[ref].files[0]) {
                     try {
                        await this.sendFileToWebPage(this.$refs[ref].files[0].name, await this.getFileBase64(this.$refs[ref].files[0]), 3);
                     }
                     catch (e) {
                        globalErr.text('Cant send file to WebPage. Please try again.');
                        throw 'ERR: sendFileToWebPage'
                     }
                  }
               }
               console.log('sendFileToWebPage - OK')

               let product_str = "";
               this.models.selectedProductList.forEach(e => {
                  product_str += e + ','
               })
               if (product_str.endsWith(',')) product_str = product_str.slice(0, -1);

               let text_json = [
                  {title1: "#" + this.models.landingPageTitle1 + "#"},
                  {text1: "#" + this.models.landingPageText1 + "#"},
                  {title2: "#" + this.models.landingPageTitle2 + "#"},
                  {text2: "#" + this.models.landingPageText2 + "#"},
               ];

               let data = {
                  id: this.params.draft ? false : this.params.prevID,
                  name: this.models.name,
                  items: product_str,
                  text: JSON.stringify(text_json),
                  region: this.models.selectedRegion,
                  big_image: "/media/img/promotions/" + this.fakeFilesName.mainBanner,
                  big_image_long: "/media/img/promotions/" + this.fakeFilesName.mainBannerLong,
                  extras: this.models.mainBannerLink.startsWith("/") ? this.models.mainBannerLink : "/" + this.models.mainBannerLink,
                  small_image: "/media/img/promotions/" + this.fakeFilesName.miniBanner,
                  small_image_link: this.models.miniBannerLink.startsWith("/") ? this.models.miniBannerLink : "/" + this.models.miniBannerLink,
                  rules_link: "/media/img/promotions/" + this.fakeFilesName.regulations,
                  enddate: this.models.selectedDate ? this.models.selectedDate : this.models.selectedDateDefault,
               }

               return data
            }
            catch (e) {
               throw e
            }
         },
         async checkForm() {
            try {
               this.checkErrors()
               const data = await this.prepareDataToPost();

               if (this.params.draft && !this.optional.createRebate) {
                  data.id = this.params.prevIDFromDraft
                  m.api.drafts_new.set({"id": this.params.prevID, "status": 1000});
               }

               if (this.optional.createRebate) {
                  window.vue_temp = new m.models.Promotions(data);
                  window.vue_temp.save();

                  console.log(window.vue_temp)

                  if (this.params.draft) {
                     m.rt.goto('rebate/' + this.params.prevID + '/true/true')
                  }
                  else if (this.params.prevID) {
                     m.rt.goto(this.variables.goTo + '/' + this.params.prevID)
                  }
                  else {
                     m.rt.goto(this.variables.goTo);
                  }
               }
               else {
                  m.lockScreen();
                  m.showDraftChooseNew(false, data, "promotions",
                     () => {
                        m.api.promotions.set(data);
                        m.unlockScreen();
                        m.rt.goto(this.variables.goTo);
                     },
                     () => {
                        m.unlockScreen();
                        m.rt.goto(this.variables.goTo);
                     }, true);
               }
            }
            catch (e) {
               console.log(e)
            }
         },
      },
      watch: {
         'optional.createRebate': {
            handler() {
               if (this.optional.createRebate) {
                  $(`#${btn.id}`).contents(":not(:empty)").first().text('Next: Create Rebate Code');
                  this.variables.goTo = this.variables.goToRebate
               }
               else {
                  $(`#${btn.id}`).contents(":not(:empty)").first().text(btn_lable);
                  this.variables.goTo = this.variables.goToPromoList
               }
            },
            deep: true
         },
         'models.selectedProductList': {
            handler() {
               this.models.selectedProduct = null;
               this.visible.productInput = false;

               this.products.list = this.products.listTemp;
               this.products.list = this.products.list.filter(i => this.models.selectedProductList.every(e => i.value !== e))
            },
            deep: true
         },
         'models.selectedRegion': {
            async handler() {
               if (this.variables.runWatch) {
                  this.models.selectedProductList = [];
                  await this.getProducts()
               }
            },
            deep: true
         },
      },
      async created() {
         this.checkParamsType()
         await this.getRegions()
         await this.getProducts()
         await this.getPrevData()
         this.setDayPicker()
      },
   })
}
