sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
    "sap/ui/model/json/JSONModel",
], function (Controller, formatter, JSONModel) {
    "use strict";

    return Controller.extend("project1.component.request.controller.Request_home", {
        formatter: formatter,

        onInit: async function () {
            const myRoute = this.getOwnerComponent().getRouter().getRoute("Request_home");
            myRoute.attachPatternMatched(this.onMyRoutePatternMatched, this);
        },
        onMyRoutePatternMatched: async function () {
            const Request = await $.ajax({
                type: "get",
                url: "../odata/v4/request/Request?orderby=request_date desc&$filter=request_state eq 'B'&$top=3"
            });

            let RequestModel = new JSONModel(Request.value);
            this.getView().setModel(RequestModel, "RequestModel");
        },
        onRequest_list: function () {
            this.getOwnerComponent().getRouter().navTo("Request");
        },
        onRequest_chart: function (oEvent) {
            this.getOwnerComponent().getRouter().navTo("Request_chart");
        }
    });
});