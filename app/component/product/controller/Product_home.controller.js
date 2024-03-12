sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
    "sap/ui/model/json/JSONModel",
], function (Controller, formatter, JSONModel) {
    "use strict";

    return Controller.extend("project1.component.product.controller.Product_home", {
        formatter: formatter,

        onInit: async function () {
            const myRoute = this.getOwnerComponent().getRouter().getRoute("Product_home");
            myRoute.attachPatternMatched(this.onMyRoutePatternMatched, this);
        },
        onMyRoutePatternMatched: async function () {
            const Product = await $.ajax({
                type: "get",
                url: "../odata/v4/product/Product?orderby=product_date desc&$top=3"
            });

            console.log("Product ->", Product.value);
            let ProductModel = new JSONModel(Product.value);
            this.getView().setModel(ProductModel, "ProductModel");

            const oProduct = await $.ajax({
                type: "get",
                url: "../odata/v4/product/Product"
            });

            let oProductModel = new JSONModel(oProduct.value);
            this.getView().setModel(oProductModel, "oProductModel");
        },
        onProduct_list: function () {
            this.getOwnerComponent().getRouter().navTo("Product");
        },
        onProduct_create: function () {
            let CreateOrder = this.getView().getModel("oProductModel").oData;
            let CreateOrderIndex = CreateOrder.length;
            let CreateNum = CreateOrder[CreateOrderIndex - 1].product_id + 1;
            console.log(CreateNum);
            this.getOwnerComponent().getRouter().navTo("Product_create", { num: CreateNum});
        }
    });
});