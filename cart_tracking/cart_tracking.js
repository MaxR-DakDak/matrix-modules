matrix.rt.add('cart_tracking', async function () {
   m.cart_tracking.cart_tracking();
})

m.cart_tracking = {};
m.cart_tracking.cart_tracking = function () {
   m.clearPage();
   let window_frame = new m.ui._new.window(page.mainpage, {size: {height: "100%"}, header: "Cart Tracking"});
   window_frame.windowSegments.center.getDom().innerHTML = m.templates.cart_tracking["cart_tracking.html"] // use catalog name

   new Vue({
      el: '#vue_matrix_cart_tracking',
      data: {
         headers: {},
         rows: {},
         models: {},
         matrix: {},
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

            this.rows.sort(function (a, b) {
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
         dateFormat(t, a, s) {
            function format(m) {
               let f = new Intl.DateTimeFormat('en', m);
               return f.format(t);
            }

            return a.map(format).join(s);
         },
         changeStatus(id) {
            this.rows.find(e => e.id === id).add_info.forEach(i => {
               console.log({id: i.id, cart_tracking: 2})
               m.api.stats_general.set({id: i.id, cart_tracking: 2});
            })
            m.rt.goto("cart_tracking");
         },
         // CREATE TABLE
         createHeaders() {
            this.headers = [
               {title: 'IP', column: 'ip'},
               {title: 'IP From', column: 'country'},
               {title: 'Date', column: 'sys_created'},
               {title: 'Page Region', column: 'country_website'},
               {title: 'Reference', column: 'referrer'},
               {title: 'Page before /cart', column: 'path'},
               {title: 'User Name', column: 'user_name'},
               {title: 'User Email', column: 'user_email'},
               {title: 'User Phone', column: 'user_phone'},
               {title: 'Cart Items', column: 'items', vhtml: true},
               {title: 'Hide', btns: [{name: "check", click: (row) => window_frame.changeStatus(row.id)}]},
            ]
            this.headers.forEach(e => {
               if (e.column) this.$set(this.models, e.column, '')
            })
         },
         createRows() {
            this.matrix.stats_general  = this.matrix.stats_general.filter(e => {
               if(!this.matrix.orders.find(i => i.php_sessionId === e.cookie)){
                  if (e.ip !== '::1' && e.ip !== '79.191.254.46' && e.ip !== '127.0.0.1') {
                     e.user_name = ''
                     e.user_email = ''
                     e.user_phone = ''
                     e.items = '';

                     if (e.user_id) {
                        let user_data = this.matrix.users.find(i => i.users_id === parseInt(e.user_id))
                        e.user_name = user_data.name + ' ' + user_data.surname
                        e.user_email = user_data.email
                        e.user_phone = user_data.phone
                     }

                     if (e.cart_items) {
                        if(JSON.parse(e.cart_items).laptops.length) {
                           JSON.parse(e.cart_items).laptops.map(i => {
                              e.items += this.matrix.laptops.find(l => l.id === parseInt(i.base)).Model_name + '<br>'
                           })
                        }
                        if(JSON.parse(e.cart_items).products.length) {
                           JSON.parse(e.cart_items).products.map(i => {
                              e.items += i.productname + '<br>'
                           })
                        }
                     }

                     if (e.country) {
                        e.country = this.matrix.countries.find(i => i.id === parseInt(e.country)).fixed_name
                     }
                     else {
                        e.country = 'Other'
                     }

                     if (e.country_website) {
                        e.country_website = this.matrix.countries.find(i => i.id === parseInt(e.country_website)).fixed_name
                     }
                     else {
                        e.country = 'Other'
                     }

                     e.sys_created = this.dateFormat(new Date(e.sys_created), [{day: 'numeric'}, {month: 'numeric'}, {year: 'numeric'}], '/');

                     return e
                  }
               }
               return false
            })

            // HERE: sys_created formatted XX/XX/XXXX - filter for same day
            this.rows = [...new Map(this.matrix.stats_general.map(item => [item.ip + "" + item.sys_created, item])).values()];

            // GET ALL ENTRIES WITH SAME IP AND DATE FOR changeStatus()
            this.rows = this.rows.map(e => {
               e.add_info = this.matrix.stats_general.filter(i => i.ip === e.ip && i.sys_created && e.sys_created)
               return e
            })
         },
         // MATRIX DATA
         async getMatrixData() {
            // LAST 30 DAYS
            let date = new Date();
            date.setDate(date.getDate() - 30);
            let dateString = date.toISOString().split('T')[0];

            this.matrix.countries = m.dictionaries.country.get({})
            this.matrix.laptops = m.dictionaries.laptops_new.get({})

            let users = await m.api.users_data.get({cart_tracking: 1})
            this.matrix.users = users.collection

            let orders = await m.api.orders.get({'more.created': dateString})
            this.matrix.orders = orders.collection

            // cart_tracking: 1 for new, 2 for hide
            let stats_general = await m.api.stats_general.get({cart_tracking: 1, 'more.created': dateString})
            this.matrix.stats_general = stats_general.collection
         },
      },
      watch: {},
      computed: {
         rowsComputed() {
            if (this.rows.length) {
               return this.rows.filter(e => {
                  for (let i = 0; i < this.headers.length; i++) {
                     if (e[this.headers[i].column] &&
                         !e[this.headers[i].column].toString().toLowerCase().includes(this.models[this.headers[i].column].toLowerCase())) {
                        return false
                     }
                  }
                  return true;
               })
            }
         },
      },
      async mounted() {
         await this.getMatrixData()
         this.createRows()
         this.createHeaders()

         window_frame.changeStatus = this.changeStatus
      },
   })
}
