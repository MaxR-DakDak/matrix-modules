matrix.rt.add('referral_test', async function () {
   m.referral_test.referral();
})

m.referral_test = {};
m.referral_test.referral = function (ParamGroup = false, ParamID = false) {
   m.clearPage();
   let window = new m.ui._new.window(page.mainpage, {size: {height: "100%"}, hreader: "???"});
   window.windowSegments.center.getDom().innerHTML = m.templates.rebate_test["referral.html"]

   new Vue({
      el: '#vue_matrix_referral',
      data: {
         models: [],
         rowsList: [],
         headersList: [],
         sortColumn: false,
         sortReverse: false,
         currenciesList: [],
         regionList: [],
      },
      methods: {
         // DEFAULT TABLE
         sortBy(e) {
            e.event.currentTarget.classList.toggle('active')

            if (this.sortColumn === e.column) {
               this.sortReverse = !this.sortReverse;
            }
            else {
               this.sortReverse = true;
               this.sortColumn = e.column;
            }

            let ascending = this.sortReverse;

            this.rowsList.sort(function (a, b) {
               if (a[e.column] > b[e.column]) {
                  return ascending ? 1 : -1
               }
               else if (a[e.column] < b[e.column]) {
                  return ascending ? -1 : 1
               }
               return 0;
            })
         },
         searchIn(e) {
            this.models[e.column] = e.value;
         },
         // CREATE TABLE
         createHeaders() {
            this.headersList = [
               {title: 'Email', column: 'email'},
               {title: 'Code', column: 'name'},
               {title: 'Region', column: 'region_new'},
               {title: 'Promo Items', column: 'items_gen', vhtml: true},
               {title: 'Free Items', column: 'items_free', vhtml: true},
               {title: 'Order Counts', column: 'order_count'},
               {title: 'Points Action', column: 'referral_action_new'},
               {title: 'Points Sum', column: 'points_sum'},
               {title: 'Points Used', column: 'referral_points_used'},
               {title: 'Change Points', input: 'referral_points_used'},
               {title: 'Save Points', btns: [{name: "check", click: (row) => window.changePoints(row.id)}]},
               {title: 'Edit Code', btns: [{name: "edit", click: (row) => m.rt.goto(`rebate/${row.id}`)}]},
            ]
            this.headersList.forEach(e => {
               if (e.column) this.$set(this.models, e.column, '')
            })
         },
         async createRows() {
            this.rowsList = await Promise.all(this.rowsList.map(async e => {
               e.order_count = 0
               e.points_sum = 0
               e.items_gen = '';
               e.items_free = '';

               if (e.add_info) {
                  e.order_count = JSON.parse(e.add_info).length

                  await Promise.all(JSON.parse(e.add_info).map(async i => {
                     let order = await m.api.orders.get({id: i.order_id});

                     if (order.collection[0] && order.collection[0].paid === 1) {
                        if (e.referral_action < 1) {
                           e.points_sum += i.rebate_items_sum * e.referral_action
                        } else {
                           e.points_sum += Math.round(e.referral_action);
                        }
                     }
                  }))
               }

               e.points_sum += ' ' + this.getCurrencyName(e.region)
               e.referral_action_new = this.prepareAction(e.referral_action)
               if (!e.referral_action_new.toString().includes('%')) e.referral_action_new += ' ' + this.getCurrencyName(e.region);

               e.region_new = this.regionList.find(r => r.id === e.region).fullname

               JSON.parse(e.items_json).map(item => {
                  for (let [key, value] of Object.entries(item)) {
                     e.items_gen += `${key}: ${value} <br>`
                  }
               });

               JSON.parse(e.items_free_json).map(item => {
                  for (let [key, value] of Object.entries(item)) {
                     e.items_free += `${key}<br>`
                  }
               });
               return e
            }));
         },
         // GET AND PROCESS DATA
         changePoints(id) {
            let input = document.getElementById(id).value;
            let rebate = this.rowsList.find(e => e.id === id);
            if (input && rebate && rebate.referral_points_used != input) {

               let data = {
                  "id": id,
                  "name": rebate.name,
                  "text": rebate.text,
                  "items_json": rebate.items_json,
                  "items_free_json": rebate.items_free_json,
                  "shipping_rebate": rebate.shipping_rebate,
                  "action": rebate.action,
                  "per_order": rebate.per_order,
                  "uses": rebate.uses,
                  "region": rebate.region,
                  "was_used": rebate.was_used,
                  "rebate_sum": rebate.rebate_sum,
                  "only_text": rebate.only_text,
                  "reff_id": rebate.reff_id,
                  "client_id": rebate.client_id,
                  "referral_action": rebate.referral_action,
                  "referral_points_used": input,
                  "add_info": rebate.add_info,
                  "reward_codes": rebate.reward_codes,
                  "enddate": rebate.enddate,
                  "promotions_id": rebate.promotions_id,
               }

               m.lockScreen();
               m.showDraftChooseNew(false, data, "promo_codes",
                  function () {
                     m.api.promo_codes.set(data);
                     m.unlockScreen();
                     m.rt.goto("referral");
                  },
                  function () {
                     m.unlockScreen();
                     m.rt.goto("referral");
                  }, true);
            }
         },
         prepareAction(action) {
            if (action.toString().includes('%')) {
               action = (parseFloat(action.toString().replace('%', '')) / 100).toFixed(2)
            }
            else if (action > 0 && action <= 1) {
               action = (action * 100) + '%';
            }
            else {
               action = Math.round(action)
            }
            return action
         },
         getCurrencyName(regionID) {
            let currencies_id = JSON.parse(this.regionList.find(e => e.id === regionID).currencies).retail;
            return this.currenciesList.find(e => e.id === currencies_id).name
         },
         async getCurrencies() {
            let currencies = await m.api.currencies.get({});
            this.currenciesList = currencies.collection;
         },
         async getRegions() {
            let regions = await m.api.regions.get();
            this.regionList = regions.collection;
         },
         async getRowsData() {
            const promo_codes = await m.api.promo_codes.get({});
            const promo_codes_arr = promo_codes.collection.filter(e => e.reff_id);

            const users = await m.api.users.get({});
            const users_arr = users.collection.map(e => {
               e.email = e.name;
               e.user_id = e.id;
               return e
            });

            this.rowsList = promo_codes_arr.map(e => ({...users_arr.find(u => u.id === e.reff_id), ...e}))
         },
      },
      computed: {
         rowsFiltered() {
            return this.rowsList.filter(e => {
               for (let i = 0; i < this.headersList.length; i++) {
                  if (e[this.headersList[i].column] &&
                      !e[this.headersList[i].column].toString().toLowerCase().includes(this.models[this.headersList[i].column].toLowerCase())) {
                     return false
                  }
               }
               return true;
            })
         },
      },
      async created() {
         await this.getCurrencies()
         await this.getRegions()
         await this.getRowsData()
         await this.createRows()
         this.createHeaders()
         window.changePoints = this.changePoints
      },
   });
}
