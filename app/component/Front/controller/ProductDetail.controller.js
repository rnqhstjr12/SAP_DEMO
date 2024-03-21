sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../model/formatter"
], function (Controller, JSONModel, formatter) {
    "use strict";

    return Controller.extend("project1.component.product.controller.ProductDetail", {
        formatter: formatter,

        onInit : function () {
            const myRoute = this.getOwnerComponent().getRouter().getRoute("ProductDetail");
            myRoute.attachPatternMatched(this.onMyRoutePatternMatched, this);
        },
        onMyRoutePatternMatched : async function () {
            let SelectedNum = window.location.href.slice(-6);
            console.log(SelectedNum);
            const Product = await $.ajax({
                type: "get",
                url: "../odata/v4/product/Product",
                data: {
                    $filter: "product_id eq " + parseInt(SelectedNum)
                }

            });
            let ProductModel = new JSONModel(Product.value);
            this.getView().setModel(ProductModel, "ProductModel");
            console.log(ProductModel.oData[0]);

            let visibleMode = new JSONModel({ footer: true, reject: true });

            this.getView().setModel(visibleMode, "visibleMode");
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
            this.getOwnerComponent().getRouter().navTo("Product");
        },
        onModifyDialog: function () {
            var oView = this.getView();
            
            if (!this.nameDialog) {
                this.nameDialog = sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "project1.component.product.view.fragment.ModifyDialog",
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
        onModify: async function () {
            let temp = new JSONModel(this.temp).oData;
            var SelectedNum = window.location.href.slice(-6);

            temp.product_name = this.byId("product_name").getValue();
            temp.product_price = parseInt(this.byId("product_price").getValue());
            temp.product_information = this.byId("product_information").getValue();

            console.log(SelectedNum);
            console.log(temp.product_name);
            console.log(temp.product_price);
            console.log(temp.product_information);
            
            await fetch("../odata/v4/product/Product/" + SelectedNum, {
                method: "PATCH",
                body: JSON.stringify(temp),
                headers: {
                    "Content-Type": "application/json;IEEE754Compatible=true",
                },
            })
            this.onCloseModify();
            this.onBack();
        },
        onCloseModify: function () {
            this.byId("ModifyDialog").destroy();
            this.nameDialog = null;
        }
    });
});
           