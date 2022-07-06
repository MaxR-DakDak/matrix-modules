matrix.rt.add('promotions_list_test', async function () {
   m.promotions_list_test.promotions_list();
})

m.promotions_list_test = {};
m.promotions_list_test.promotions_list = function (id = false, draft = false) {
   m.clearPage();
   let window = new m.ui._new.window(page.mainpage, {size: {height: "100%"}, header: "Promotions"});
   window.windowSegments.center.getDom().innerHTML = m.templates.rebate_test["promotions_list.html"] // use catalog name

   new Vue({
      el: '#vue_matrix_promotions_list',
      data: {
         models: [],
         rowsList: [],
         headersList: [],
         regionList: [],
         sortColumn: false,
         sortReverse: false,
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
         dateFormat(t, a, s) {
            function format(m) {
               let f = new Intl.DateTimeFormat('en', m);
               return f.format(t);
            }

            return a.map(format).join(s);
         },
         // CREATE TABLE
         createHeaders() {
            this.headersList = [
               {title: 'Name', column: 'name'},
               {title: 'Region', column: 'region'},
               {title: 'Products', column: 'items'},
               {title: 'End Date', column: 'enddate'},
               {title: 'Edit Promo', btns: [{name: "edit", click: (row) => m.rt.goto(`promotions/${row.id}`)}]},
            ]
            this.headersList.forEach(e => {
               if (e.column) this.$set(this.models, e.column, '')
            })
         },
         createRows() {
            this.rowsList = this.rowsList.map(e => {

               let separator = false
               if (!e.items.trim().toString().includes('all') && e.items.trim().toString().includes(' ')) {
                  separator = ' '
               }
               else if (e.items.trim().toString().includes(',')) {
                  separator = ','
               }

               if (separator) {
                  e.items = e.items.split(separator)[0] + ' ...';
               }

               e.region = this.regionList.find(r => r.id === parseInt(e.region)).fullname
               e.enddate = this.dateFormat(new Date(e.enddate), [{day: 'numeric'}, {month: 'numeric'}, {year: 'numeric'}], '/');
               return e
            })
         },
         async getRegions() {
            let regions = await m.api.regions.get();
            this.regionList = regions.collection;
         },
         async getRowsData() {
            const data = await m.api.promotions.get({});
            this.rowsList = data.collection.filter(e => e.region !== 'zz' && e.region !== 'pl' && e.region !== 'eu')
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
         await this.getRegions()
         await this.getRowsData()
         this.createHeaders()
         this.createRows()
      },
   })
}
