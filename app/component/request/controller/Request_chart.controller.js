sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("project1.component.request.controller.Request_chart", {
        onInit: function () {
            var oData =
            {
                wait: 0,
                waitpercent: '',
                approve: 0,
                approvepercent: '',
                reject: 0,
                rejectpercent: ''
            };

            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel, "state");
            this.onDataView();
        },
        onRequesthome: function () {
            this.getOwnerComponent().getRouter().navTo("Request_home");
        },
        onDataView:  function () {
            this.onNewChart();
        },
        onNewChart: async function () {
            var view = this.getView();
            var month = (new Date().getMonth() + 1);
            var oMonth = new Date().getFullYear() + "-" + (month < 10 ? "0" + month : month);

            console.log(oMonth);

            const Request = await $.ajax({
                type: "get",
                url: "/odata/v4/request/Request?$filter=contains(request_date,'"+oMonth+"')"
            });

            console.log(Request.value);

            let RequestModel = new JSONModel(Request.value);
            view.setModel(RequestModel, "RequestModel");
            
            let data = view.getModel("RequestModel");
            let a = 0.00, b = 0.00, c = 0.00;
            let aCnt = 0, bCnt = 0, cCnt = 0;
            let cnt = 0;
            for (let i = 0; i < data.oData.length; i++) {
                let state = '/' + i + '/request_state';
                if (data.getProperty(state) === 'A') {
                    cnt++;
                    aCnt++;
                    a++;
                }
                if (data.getProperty(state) === 'B') {
                    cnt++;
                    bCnt++;
                    b++;
                }
                if (data.getProperty(state) === 'C') {
                    cnt++;
                    cCnt++;
                    c++;
                }
            }
            console.log(a);
            console.log(b);
            console.log(c);
            
            view.getModel("state").setProperty("/newChartQuantity", cnt);
            view.getModel("state").setProperty("/newChartaQuantity", aCnt);
            view.getModel("state").setProperty("/newChartbQuantity", bCnt);
            view.getModel("state").setProperty("/newChartcQuantity", cCnt);
            view.getModel("state").setProperty("/approve", a / data.oData.length * 100);
            view.getModel("state").setProperty("/wait", b / data.oData.length * 100);
            view.getModel("state").setProperty("/reject", c / data.oData.length * 100);
            view.getModel("state").setProperty("/approvepercent", (Math.floor(a / data.oData.length * 10000) / 100) + '%');
            view.getModel("state").setProperty("/waitpercent", (Math.floor(b / data.oData.length * 10000) / 100) + '%');
            view.getModel("state").setProperty("/rejectpercent", (Math.floor(c / data.oData.length * 10000) / 100) + '%');
        }
    });
});