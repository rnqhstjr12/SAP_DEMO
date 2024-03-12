sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../model/formatter"
], function (Controller, JSONModel, formatter) {
    "use strict";

    return Controller.extend("project1.component.request.controller.OrderDetail", {
        formatter: formatter,

        onInit : function () {
            const myRoute = this.getOwnerComponent().getRouter().getRoute("OrderDetail");
            myRoute.attachPatternMatched(this.onMyRoutePatternMatched, this);
        },
        onMyRoutePatternMatched : async function () {
            let SelectedNum = window.location.href.slice(-10);

            const Request = await $.ajax({
                type: "get",
                url: "../odata/v4/request/Request?$filter=request_number eq " + SelectedNum
            });

            let RequestModel = new JSONModel(Request.value);
            this.getView().setModel(RequestModel, "RequestModel");
            console.log(RequestModel.oData[0]);

            let visibleMode = new JSONModel({ footer: false, reject: false });

            if (RequestModel.oData[0].request_state == 'B') {
                visibleMode.oData.footer = true;
            } else if (RequestModel.oData[0].request_state == 'C') {
                visibleMode.oData.reject = true;
            }

            this.getView().setModel(visibleMode, "visibleMode");
        },
        onApprove : async function () {
            let temp = new JSONModel(this.temp).oData;
            temp.request_number = parseInt(this.byId("ReqNum").getText());
            temp.request_state = "A";

            let url = "../odata/v4/request/Request/" + temp.request_number;
            await this.onUpdate(url, temp);
            MessageToast.show("승인되었습니다.");
        },
        onUpdate : async function (url, data) {
            await fetch(url, {
                method: "PATCH",
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json;IEEE754Compatible=true",
                },
            })
            this.onBack();
        },
        onBack: function () {
            this.getOwnerComponent().getRouter().navTo("Request");
        },
        onReject : function () {
            var oView = this.getView();

            if (!this.nameDialog) {
                this.nameDialog = sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "project1.component.request.view.fragment.OrderRejectDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this.nameDialog.then(function (oDialog) {
                oDialog.open();
            });
        },
        onInputRejectReason : async function () {
            let temp = new JSONModel(this.temp).oData;
            temp.request_number = parseInt(this.byId("ReqNum").getText());
            temp.request_state = "C";
            temp.request_reject_reason = this.getView().byId("RejectReason").getValue();

            let url = "../odata/v4/request/Request/" + temp.request_number;
            await this.onUpdate(url, temp);
            this.onCancelRejectReason();
            MessageToast.show("반려되었습니다.");
        },
        onCancelRejectReason : function () {
            this.byId("OrderRejectDialog").destroy();
            this.nameDialog=null;
        }
    });
});
           