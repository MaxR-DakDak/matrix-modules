matrix.rt.add('rebate', async function () {
   m.rebate.rebate();
})

matrix.rt.add('rebate/:id', async function (params) {
   m.rebate.rebate(isNaN(params.id) ? false : params.id);
});

matrix.rt.add('rebate/:id/:draft', async function (params) {
   m.rebate.rebate(isNaN(params.id) ? false : params.id, params.draft.toLocaleString().toLowerCase() === 'true' || params.draft.toLocaleString().toLowerCase() === 'draft');
});

matrix.rt.add('rebate/:id/:draft/:frompromo', async function (params) {
   m.rebate.rebate(isNaN(params.id) ? false : params.id, params.draft.toLocaleString().toLowerCase() === 'true' || params.draft.toLocaleString().toLowerCase() === 'draft', true);
});

matrix.rt.add('rebate/:id/:draft/:frompromo/:promoid', async function (params) {
   m.rebate.rebate(isNaN(params.id) ? false : params.id, params.draft.toLocaleString().toLowerCase() === 'true' || params.draft.toLocaleString().toLowerCase() === 'draft', true, params.promoid);
});

m.rebate = {};
m.rebate.rebate = function (id = false, draft = false, fromPromo = false, promoID = false) {
   m.clearPage();
   let window_frame = new m.ui._new.window(page.mainpage, {size: {height: "100%"}, header: "Rebate"});
   window_frame.windowSegments.center.getDom().innerHTML = m.templates.rebate["rebate.html"]
   let btn = new m.ui._new.button(window_frame.windowSegments.bottomRight, {size: {width: "auto"}, label: draft ? 'Accept' : 'Save'});
   btn.on("click", async function () {
      document.getElementById("vue_hidden_btn").click();
   });

   new Vue({
      el: '#vue_matrix_rebate',
      data: {
         name: null,
         text: null,
         shipping: 0,
         uses: 1,
         usesPerOrder: 1,
         onlyText: 0,
         refList: [],
         refSelected: null,
         refSelectedID: 0,
         refAction: 0,
         clientList: [],
         clientSelected: null,
         clientSelectedID: 0,
         regionList: [],
         regionSelected: 5,
         itemsList: [],
         itemsListTemp: [],
         itemsGeneral: null,
         itemsGeneralData: [],
         itemsFree: null,
         itemsFreeData: [],
         itemsKeys: null,
         itemsKeysData: [],
         codeExist: false,
         rebateEdit: id,
         rebateDraft: draft,
         rebateToPromo: fromPromo,
         rebatePrev: null,
         rebatePrevID: null,
         defaultDate: "2030-01-01",
         dateSelected: null,
         addInfo: false,
         ordersInfo: [],
         optional: {
            showBundle: false,
            showShipping: false,
            showLimitOrder: false,
            showLimitEmail: false,
            showReferral: false,
            showGameCodes: false,
         },
         models: {
            itemsGeneralData: {},
            itemsFreeData: {},
         },
         itemsInput: false,
         itemsFreeInput: false,
         itemsKeysInput: false,
         shippingPriceData: null,
         currenciesList: [],
         currenciesName: null,
         promoID: promoID,
         referral_points_used: 0,
      },
      methods: {
         mouseOver(evt) {
            document.getElementById(evt).focus();
         },
         isNumber(evt) {
            evt = (evt) ? evt : window.event;
            let charCode = (evt.which) ? evt.which : evt.keyCode;
            if ((charCode > 31 && (charCode < 48 || charCode > 57)) && charCode !== 46 && charCode !== 37) evt.preventDefault();
            else return true;
         },
         setDayPicker() {
            new Pikaday({
               field: document.getElementById('vue_datepicker'),
               onSelect: date => {
                  let year = date.getFullYear()
                  let month = date.getMonth() + 1
                  let day = date.getDate()
                  this.dateSelected = [year, month < 10 ? '0' + month : month, day < 10 ? '0' + day : day].join('-');
               }
            }).setDate(new Date((!this.rebateEdit && !this.rebateDraft) ? "" : this.dateSelected));
         },
         gameKeysAdd(item, action = 1) {
            let array = this.itemsKeysData
            if (!item.trim().toString().includes('all') && item.trim().toString().includes(' ')) {
               let products_array = item.split(' ');
               products_array.forEach(item => {
                  if (!array.some(e => e[item] !== undefined)) {
                     let obj = {};
                     obj[item] = action;
                     array.push(obj)
                  }
               })
            }
            else if (item.trim().toString().includes(',')) {
               let products_array = item.split(',');
               products_array.forEach(item => {
                  if (!array.some(e => e[item] !== undefined)) {
                     let obj = {};
                     obj[item] = action;
                     array.push(obj)
                  }
               })
            }
            else if (!array.some(e => e[item] !== undefined)) {
               let obj = {};
               obj[item] = action;
               array.push(obj)
            }
            this.itemsKeys = null;
         },
         gameKeysRemove(item) {
            this.itemsKeys = null;
            this.itemsKeysData = this.itemsKeysData.filter(e => e[item] === undefined)
         },
         itemAdd(item, action, general = false) {
            let array = [];
            if (general) {
               array = this.itemsGeneralData;
               this.models.itemsGeneralData[item] = action;
            }
            else {
               array = this.itemsFreeData
               this.models.itemsFreeData[item] = action;
            }

            if (!item.trim().toString().includes('all') && item.trim().toString().includes(' ')) {
               let products_array = item.split(' ');
               products_array.forEach(e => {
                  this.itemsList.forEach(p => {
                     if (p.value === e) {
                        let obj = {};
                        obj[e] = this.prepareAction(action);
                        array.push(obj)
                        return false;
                     }
                  })
               })
            }
            else if (item.trim().toString().includes(',')) {
               let products_array = item.split(',');
               products_array.forEach(e => {
                  this.itemsList.forEach(p => {
                     if (p.value === e) {
                        let obj = {};
                        obj[e] = this.prepareAction(action);
                        array.push(obj)
                        return false;
                     }
                  })
               })
            }
            else if (!array.some(e => e[item] !== undefined)) {
               this.itemsList.forEach(p => {
                  if (p.value === item) {
                     let obj = {};
                     obj[item] = this.prepareAction(action)
                     array.push(obj)
                     return false;
                  }
               })
            }
            else {
               array.map(e => {
                  if (e[item] !== undefined) e[item] = this.prepareAction(action)
               });
            }
         },
         itemRemove(item, general = false) {
            this.itemsGeneral = null
            this.itemsFree = null;

            if (general) this.itemsGeneralData = this.itemsGeneralData.filter(e => e[item] === undefined)
            else this.itemsFreeData = this.itemsFreeData.filter(e => e[item] === undefined)
         },
         itemListUpdate() {
            this.itemsFreeInput = false;
            this.itemsInput = false;
            this.itemsGeneral = null;
            this.itemsFree = null;

            this.itemsList = this.itemsListTemp;
            this.itemsList = this.itemsList.filter(i => this.itemsGeneralData.every(e => i.value !== Object.keys(e)[0]))
            this.itemsList = this.itemsList.filter(i => this.itemsFreeData.every(e => i.value !== Object.keys(e)[0]))
         },
         prepareAction(action, prepareToPost = false) {
            if (action.toString().includes('%') && prepareToPost) {
               action = (parseFloat(action.toString().replace('%', '')) / 100).toFixed(2)
            }
            else if (action > 0 && action <= 1) {
               action = (action * 100) + '%';
            }
            return action
         },
         showCurrency(value) {
            if (!value.toString().includes('%')) {
               return this.currenciesName
            }
            else {
               return '%'
            }
         },
         getCurrencyName() {
            let currencies_id = JSON.parse(this.regionList.find(e => e.id === this.regionSelected).currencies).retail;
            this.currenciesName = this.currenciesList.find(e => e.id === currencies_id).name
         },
         getShippingPrice() {
            let region_name = this.regionList.find(e => e.id === this.regionSelected).name
            let found = false;
            if(this.shippingPriceData != null) {
               this.shippingPriceData.forEach(e => {
                  [JSON.parse(e.regions)].forEach(r => {
                     for (let [key, value] of Object.entries(r)) {
                        if (key === region_name) {
                           this.shipping = value.cost_website;
                           found = true;
                        }
                     }
                  })
               })
            }
            if (!found) this.shipping = 0;
         },
         async getPrevRebate() {
            if (this.rebateEdit && this.rebateDraft && this.rebateToPromo) {
               let get_data = await m.api.drafts_new.get({"id": this.rebateEdit});
               this.rebatePrev = JSON.parse(get_data.collection[0].data)[1][3]
            }
            else if (this.rebateToPromo) {
               this.itemAdd(window.vue_temp.data.items, "0%", true)
            }
            else if (this.rebateDraft) {
               let get_data = await m.api.drafts_new.get({"id": this.rebateEdit});
               this.rebatePrev = JSON.parse(get_data.collection[0].data).parsed
            }
            else if (this.rebateEdit) {
               let get_data = await m.api.promo_codes.get({"id": this.rebateEdit});
               this.rebatePrev = get_data.collection[0]
            }

            if (this.rebatePrev) {
               this.name = this.rebatePrev.name
               this.text = this.rebatePrev.text
               this.shipping = this.rebatePrev.shipping_rebate
               this.uses = this.rebatePrev.uses
               this.usesPerOrder = this.rebatePrev.per_order
               this.regionSelected = this.rebatePrev.region
               this.onlyText = this.rebatePrev.only_text
               this.dateSelected = this.rebatePrev.enddate
               this.clientSelected = (this.clientList.find(e => e.id === this.rebatePrev.client_id)).name
               this.refSelected = (this.clientList.find(e => e.id === this.rebatePrev.reff_id)).name
               this.refAction = (this.rebatePrev.referral_action > 1) ? Math.floor(this.rebatePrev.referral_action) : this.rebatePrev.referral_action
               this.rebatePrevID = this.rebatePrev.id
               this.referral_points_used = this.rebatePrev.referral_points_used

               this.refAction = this.prepareAction(this.refAction)

               if (this.shipping > 0) this.optional.showShipping = true;
               if (this.usesPerOrder !== 1) this.optional.showLimitOrder = true;
               if (this.rebatePrev.client_id) this.optional.showLimitEmail = true;
               if (this.rebatePrev.reff_id) this.optional.showReferral = true;

               console.log(Object.keys(JSON.parse(this.rebatePrev.items_json)[0])[0]);
               console.log(Object.values(JSON.parse(this.rebatePrev.items_json)[0])[0]);

               JSON.parse(this.rebatePrev.items_json).map(e => {
                  for (let [key, value] of Object.entries(e)) {
                     if (value < 1) value = parseFloat(value) * 100 + '%'
                     this.itemAdd(key, value, true)
                  }
               });
               JSON.parse(this.rebatePrev.items_free_json).map(e => {
                  for (let [key, value] of Object.entries(e)) {
                     this.itemAdd(key, value)
                     this.optional.showBundle = true;
                  }
               });
               JSON.parse(this.rebatePrev.reward_codes).map(e => {
                  for (let [key, value] of Object.entries(e)) {
                     this.gameKeysAdd(key, value)
                     this.optional.showGameCodes = true;
                  }
               });
            }
            else {
               this.rebateDraft = null;
               this.rebateEdit = null;
               this.rebatePrev = null;
            }
         },
         async getItemsList() {
            this.itemsList.push({value: "all laptops", name: "all laptops"});
            this.itemsList.push({value: "all mice", name: "all mice"});
            this.itemsList.push({value: "all mousepads", name: "all mousepads"});
            this.itemsList.push({value: "all keyboards", name: "all keyboards"});

            let products2021 = await m.api.product2021.get();
            for (let i = 0; i < products2021.collection.length; i++) {
               this.itemsList.push({"value": products2021.collection[i].model_name, "name": products2021.collection[i].model_name});
            }

            let laptopsReg = await m.api.laptops_new.get({"Visible": "1", "Type": "Regular", "getfields": "id,Model_name"})
            for (let i = 0; i < laptopsReg.collection.length; i++) {
               this.itemsList.push({"value": laptopsReg.collection[i].model_name, "name": laptopsReg.collection[i].model_name});
            }

            let laptopsPre = await m.api.laptops_new.get({"Visible": "1", "Type": "Preorder", "getfields": "id,Model_name"})
            for (let i = 0; i < laptopsPre.collection.length; i++) {
               this.itemsList.push({"value": laptopsPre.collection[i].model_name, "name": laptopsPre.collection[i].model_name});
            }

            this.itemsListTemp = this.itemsList
         },
         async getRegions() {
            let regions = await m.api.regions.get();
            this.regionList = regions.collection;
         },
         async getClientID() {
            let clients = await m.api.users.get({});
            this.clientList = clients.collection;
            this.clientList.push({"name": "None", "id": 0});
            this.clientList.sort((a, b) => {
               if (a.name < b.name) return -1
               if (a.name > b.name) return 1
               return 0
            })
         },
         async getShipping() {
            let shipping = await m.api.shipping_companies.get({"matrix": 1});
            this.shippingPriceData = shipping.collection
            this.getShippingPrice()
         },
         async getCurrencies() {
            let currencies = await m.api.currencies.get({});
            this.currenciesList = currencies.collection;
            this.getCurrencyName();
         },
         async checkPromoName() {
            let data = await m.api.promo_codes.get({"name": this.name});
            this.codeExist = data.collection.length
            return this.codeExist;
         },
         async checkDataToPost() {
            if (this.optional.showLimitEmail && this.clientSelected) {
               if (this.clientList.find(e => e.name === this.clientSelected)) {
                  this.clientSelectedID = this.clientList.find(e => e.name === this.clientSelected).id
               }
               else {
                  throw 'clientIDDontExist';
               }
            }
            else {
               this.clientSelectedID = 0;
            }

            if (this.optional.showReferral && this.refSelected) {
               await this.getClientID()
               if (this.clientList.find(e => e.name === this.refSelected)) {
                  this.refSelectedID = this.clientList.find(e => e.name === this.refSelected).id
               }
               else {
                  let set_users = await m.api.users.set({name: this.refSelected, active: 1})
                  this.refSelectedID = set_users.collection[0].id
               }
            }
            else {
               this.refSelectedID = 0;
               this.refAction = 0;
            }

            if (this.usesPerOrder === 0) this.usesPerOrder = 1;

            this.itemsGeneralData.map(e => {
               for (let [key, value] of Object.entries(e)) {
                  let action = this.prepareAction(value, true);
                  e[key] = isNaN(action) ? 0 : action
               }
            })

            this.itemsFreeData.map(e => {
               for (let [key, value] of Object.entries(e)) {
                  let action = this.prepareAction(value, true);
                  e[key] = isNaN(action) ? 0 : action
               }
            })
         },
         async checkForm() {
            if (await this.checkErrors()) this.submitForm(this.rebateEdit);
         },
         async checkErrors(err = false) {
            let ready = true;

            if (await this.checkPromoName() && !this.rebateEdit) {
               ready = false
               $('#name').css("borderColor", "red");
               $('#nameError').text("ALREADY EXIST");
            }
            else if (!this.name || this.name.length < 3) {
               ready = false
               $('#name').css("borderColor", "red");
               $('#nameError').text("EMPTY CODE");
            }
            else {
               $('#name').css("borderColor", "");
               $('#nameError').text("");
            }

            if (!this.text) {
               ready = false
               $('#text').css("borderColor", "red");
               $('#textError').text("EMPTY TEXT");
            }
            else {
               $('#text').css("borderColor", "");
               $('#textError').text("");
            }

            if (!this.itemsGeneralData.length) {
               ready = false
               $('#itemsListError').text("EMPTY PROMO ITEM");
            }
            else {
               $('#itemsListError').text("");
            }

            if (err === 'clientIDDontExist') {
               ready = false
               $('#clientIDError').text("CLIENT EMAIL DON'T EXIST");
               $('#clientID').css("borderColor", "red");
            }
            else {
               $('#clientIDError').text("");
               $('#clientID').css("borderColor", "");
            }

            return ready
         },
         async submitForm(useID = false) {
            try {
               if (this.rebateDraft) {
                  useID = this.rebatePrevID;
                  m.api.drafts_new.set({"id": this.rebateEdit, "status": 1000});
               }

               await this.checkDataToPost();

               let data = {
                  "id": useID,
                  "items_json": JSON.stringify(this.itemsGeneralData),
                  "items_free_json": this.optional.showBundle && this.itemsFreeData.length ? JSON.stringify(this.itemsFreeData) : '[]',
                  "reward_codes": this.optional.showGameCodes && this.itemsKeysData.length ? JSON.stringify(this.itemsKeysData) : '[]',
                  "name": this.name.trim(),
                  "text": this.text,
                  "shipping_rebate": this.optional.showShipping ? this.shipping : 0,
                  "uses": this.uses ? this.uses : 1,
                  "per_order": this.optional.showLimitOrder ? this.usesPerOrder : 1,
                  "region": this.regionSelected,
                  "only_text": this.onlyText,
                  "client_id": this.clientSelectedID ? this.clientSelectedID : 0,
                  "reff_id": this.refSelectedID ? this.refSelectedID : 0,
                  "referral_action": this.refAction ? this.prepareAction(this.refAction, true) : 0,
                  "enddate": this.dateSelected ? this.dateSelected : this.defaultDate,
                  "promotions_id": this.promoID ? this.promoID : false,
                  "referral_points_used": this.referral_points_used,
               }

               if (this.rebateToPromo && !this.promoID) {
                  window.vue_temp.addTo("rebate", new m.models.Promo_codes(data));
                  let response = window.vue_temp.save()

                  m.showDraftTR("promotions", false, response, "",
                     function () {
                        response.execute()
                        m.unlockScreen();
                        m.rt.goto("website/lists/rebates");
                     },
                     function () {
                        m.unlockScreen();
                        m.rt.goto("website/lists/rebates");
                     });
               }
               else {
                  m.lockScreen();
                  m.showDraftChooseNew(false, data, "promo_codes",
                     function () {
                        m.api.promo_codes.set(data);
                        m.unlockScreen();
                        m.rt.goto("website/lists/rebates");
                     },
                     function () {
                        m.unlockScreen();
                        m.rt.goto("website/lists/rebates");
                     }, true);
               }
            }
            catch (e) {
               await this.checkErrors(e)
            }
         },
      },
      watch: {
         regionSelected() {
            this.getShippingPrice()
            this.getCurrencyName()
         },
         itemsGeneralData() {
            this.itemListUpdate()
         },
         itemsFreeData() {
            this.itemListUpdate()
         }
      },
      async created() {
         await this.getClientID()
         await this.getItemsList()
         await this.getRegions()
         await this.getPrevRebate()
         await this.getShipping()
         await this.getCurrencies()
         this.setDayPicker()
      },
   })
}
