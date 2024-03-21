sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    ], function (Controller, JSONModel, MessageToast, MessageBox, Filter, FilterOperator, Fragment) {
        "use strict";

        let Today, CreateNum;
        
        return Controller.extend("project1.component.product.controller.Product_create", {
            onInit : function () {
                const myRoute = this.getOwnerComponent().getRouter().getRoute("Product_create");
                myRoute.attachPatternMatched(this.onMyRoutePatternMatched, this);
            },
            onMyRoutePatternMatched : function () {
                this.onClearField();
                CreateNum = window.location.href.slice(-6);
                console.log(CreateNum);
                let now = new Date();
                Today = now.getFullYear() + "-" + (now.getMonth()+1).toString().padStart(2, '0')
                    + "-" + now.getDate().toString().padStart(2, '0');

                this.getView().byId("ProductId").setText(CreateNum);
                this.getView().byId("ProductDate").setText(Today);
                this.onDataView();
            },
            onDataView: async function () {
                const Product = await $.ajax({
                    type: "get",
                    url: "../odata/v4/product/Product"
                });
                console.log(Product.value);
                let ProductModel = new JSONModel(Product.value);
                this.getView().setModel(ProductModel, "ProductModel");
            },
            onCreate : async function () {
                let temp = new JSONModel(this.temp).oData;
                temp.product_name = this.byId("ProductName").getValue();
                temp.product_information = this.byId("ProductInfo").getValue();
                temp.product_price = this.byId("ProductPrice").getValue();
                temp.product_id = parseInt(CreateNum);
                temp.product_date = Today;
                console.log(temp);

                if (!temp.product_name || !temp.product_information || !temp.product_price) {
                    MessageBox.show("빈칸이 존재할시 생성되지 않습니다.");
                    return;
                }

                if (!temp.product_name) {
                    MessageBox.show("요청 물품을 입력해주세요.");
                    return;
                }
                if (temp.product_price && temp.product_price < 1) {
                    MessageBox.show("물품 가격은 0이 될수 없습니다.\n다시 입력해주세요.");
                    this.byId("ProductPrice").setValue("");
                    return;
                }

                if (!temp.product_price) {
                    MessageBox.show("물품 가격을 입력해주세요.");
                    return;
                } else if (isNaN(parseInt(temp.product_price, 10)) && temp.product_price) {
                    MessageBox.show("물품 가격은 숫자여야 합니다.\n다시 입력해주세요.");
                    this.byId("ProductPrice").setValue("");
                    return;
                } else {
                    
                    temp.product_price = parseInt(this.byId("ProductPrice").getValue());
                }

                if (!temp.product_information) {
                    MessageBox.show("물품 설명을 입력해주세요.");
                    return;
                }
                
                await fetch("../odata/v4/product/Product", {
                    method: "POST",
                    body: JSON.stringify(temp),
                    headers: {
                        "Content-Type": "application/json;IEEE754Compatible=true",
                    },
                }).then(response => {
                    console.log(response.status);
                    return response.json();
                }).then(data => {
                    console.log(data);
                }).catch(error => {
                    console.log("error", error);
                })
                this.onBack();
                MessageToast.show("등록되었습니다.");
                location.reload();
            },
            onClearField : function () {
                this.getView().byId("ProductName").setValue("");
                this.getView().byId("ProductPrice").setValue("");
                this.getView().byId("ProductInfo").setValue("");
            },
            onBack : function () {
                this.getOwnerComponent().getRouter().navTo("Product");
            },
    });
});