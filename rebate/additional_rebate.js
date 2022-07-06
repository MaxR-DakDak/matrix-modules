matrix.rt.add('additional_rebate_test', async function () {
   m.rebate_test.additional_rebate();
})

m.rebate_test = {};
m.rebate_test.additional_rebate = function () {
   m.clearPage();
   let window_frame = new m.ui._new.window(page.mainpage, {size: {height: "100%"}, header: "Additional Rebate"});
   window_frame.windowSegments.center.getDom().innerHTML = m.templates.rebate_test["additional_rebate.html"]
   let btn = new m.ui._new.button(window_frame.windowSegments.bottomRight, {size: {width: "auto"}, label: 'Save'});
   btn.on("click", async function () {
      document.getElementById("vue_hidden_btn").click();
   });

   new Vue({
      el: '#vue_matrix_additional_rebate',
      data: {
         matrix: {
            products_all: []
         },
         models: {},
         optional: {
            laptop: true,
            keyboard: true,
            mice: true,
            mousepad: true,
         },
         html: [
            {label: 'Items For Laptops:', category: 'laptop', items: 3},
            {label: 'Items For Keyboards:', category: 'keyboard', items: 3},
            {label: 'Items For Mice:', category: 'mice', items: 3},
            {label: 'Items For Pads:', category: 'mousepad', items: 3},
         ],
      },
      methods: {
         cleanSelectedItems() {
            for (const [key, value] of Object.entries(this.optional)) {
               if (!value) {
                  for (const models_key of Object.keys(this.models)) {
                     if (models_key.includes(key)) {
                        delete (this.models[models_key])
                     }
                  }
               }
            }
         },
         getInputValue(value, cat, index) {
            if (Object.keys(value)[0] === '') {
               delete (this.models[cat][index])
            }
            else {
               this.matrix.products_all.some(item => {
                  if (item.value === Object.keys(value)[0]) {
                     if (!this.models[cat]) this.$set(this.models, cat, {})
                     this.models[cat][index] = {[Object.keys(value)[0]]: Object.values(value)[0]};
                  }
               })
            }
         },
         submitForm() {
            m.api.additional_rebate.set({"id": 1, "data": JSON.stringify(this.models)})
            location.reload();
         },
         async getMatrixData() {
            let acc = await m.api.product2021.get({"getfields": "id,model_name"});
            for (let i = 0; i < acc.collection.length; i++) {
               this.matrix.products_all.push({"value": acc.collection[i].model_name, "name": acc.collection[i].model_name});
            }

            let rebate = await m.api.additional_rebate.get({'id': 1});
            let prev_rebate = rebate.collection[0]

            for (let [key, value] of Object.entries(JSON.parse(prev_rebate.data))) {
               this.html = this.html.map(h => {
                  if (h.category === key) {
                     h.item_value = value
                  }
                  return h
               })
            }
         },
      },
      watch: {
         'optional': {
            async handler() {
               this.cleanSelectedItems()
            },
            deep: true
         },
      },
      async mounted() {
         await this.getMatrixData()
      },
   })
}
