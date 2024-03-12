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
        
        return Controller.extend("project1.component.request.controller.CreateOrder", {
            onInit : function () {
                const myRoute = this.getOwnerComponent().getRouter().getRoute("CreateOrder");
                myRoute.attachPatternMatched(this.onMyRoutePatternMatched, this);
            },
            onMyRoutePatternMatched : function () {
                this.onClearField();
                CreateNum = window.location.href.slice(-10);

                let now = new Date();
                Today = now.getFullYear() + "-" + (now.getMonth()+1).toString().padStart(2, '0')
                    + "-" + now.getDate().toString().padStart(2, '0');

                this.getView().byId("ReqNum").setText(CreateNum);
                this.getView().byId("ReqDate").setText(Today);
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
                temp.request_product = this.byId("ReqGood").getValue();
                temp.request_quantity = this.byId("ReqQty").getValue();
                temp.requestor = this.byId("Requester").getValue();
                temp.request_reason = this.byId("ReqReason").getValue();
                temp.request_number = parseInt(CreateNum);
                temp.request_state = "B";
                temp.request_date = Today;
                temp.request_estimated_price = this.byId("ReqPrice").getValue();
                if (!temp.request_product || !temp.request_quantity || !temp.request_estimated_price || !temp.requestor) {
                    MessageBox.show("빈칸이 존재할시 생성되지 않습니다.\n(요청사유 제외)");
                    return;
                }
                if (!temp.request_product) {
                    MessageBox.show("요청 물품을 입력해주세요.");
                    return;
                }

                if (temp.request_quantity && temp.request_quantity < 1) {
                    MessageBox.show("물품 개수는 0이 될수 없습니다.\n다시 입력해주세요.");
                    this.byId("ReqQty").setValue("");
                    return;
                }
                if (!temp.request_quantity) {
                    MessageBox.show("물품 개수를 입력해주세요.");
                    return;
                } else if (isNaN(parseInt(temp.request_quantity, 10))) {
                    MessageBox.show("물품 개수는 숫자여야 합니다.\n다시 입력해주세요.");
                    this.byId("ReqQty").setValue("");
                    return;
                } else {
                    
                    temp.request_quantity = parseInt(this.byId("ReqQty").getValue());
                }

                if (!temp.requestor) {
                    MessageBox.show("요청자를 입력해주세요.");
                    return;
                } else {
                    const regexString = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/;
                    if (regexString.test(temp.requestor) || !isNaN(parseInt(temp.requestor, 10))) {
                        MessageBox.show("이름엔 숫자 또는 특수문자가 포함될수 없습니다.\n다시 입력해주세요.");
                        this.byId("Requester").setValue("");
                        return;
                    }
                }

                if (!temp.request_estimated_price) {
                    MessageBox.show("예상 가격을 입력해주세요.");
                    return;
                } else if (isNaN(parseInt(temp.request_estimated_price, 10))) {
                    MessageBox.show("예상 가격은 숫자여야 합니다.\n다시 입력해주세요.");
                    this.byId("ReqPrice").setValue("");
                    return;
                } else {
                    if (temp.request_estimated_price < 1) {
                        MessageBox.show("예상 가격은 0이 될수 없습니다.\n다시 입력해주세요.");
                        this.byId("ReqQty").setValue("");
                        return;
                    }
                    temp.request_estimated_price = parseInt(this.byId("ReqPrice").getValue());
                }

                if (!temp.request_reason) {
                    MessageBox.show("요청 사유를 입력해주세요.");
                    return;
                }

                
                if (!this.onProductCheck(temp.request_product)) {
                    MessageBox.show("존재하는 물품이 아닙니다.");
                    console.log(this.onProductCheck(temp.request_product));
                    return;
                }

                await fetch("../odata/v4/request/Request", {
                    method: "POST",
                    body: JSON.stringify(temp),
                    headers: {
                        "Content-Type": "application/json;IEEE754Compatible=true",
                    },
                })
                this.onBack();
                MessageToast.show("생성되었습니다.");
                location.reload();
            },
            onProductCheck: function (data) {
                let oProductModel = this.getView().getModel("ProductModel").getData();
                return oProductModel.some(product => product.product_name === data);
            },
            onClearField : function () {
                this.getView().byId("ReqGood").setValue("");
                this.getView().byId("ReqQty").setValue("");
                this.getView().byId("Requester").setValue("");
                this.getView().byId("ReqPrice").setValue("");
                this.getView().byId("ReqReason").setValue("");
            },
            onBack : function () {
                this.getOwnerComponent().getRouter().navTo("Request");
            },
            onValueHelpRequest: function (oEvent) {
                var oView = this.getView();
                var InputValue = oEvent.getSource().getValue();

                console.log("ProductModel ->", this.getView().getModel("ProductModel").getData());
                
                if (!this.nameDialog) {
                    this.nameDialog = sap.ui.core.Fragment.load({
                        id: oView.getId(),
                        name: "project1.component.request.view.fragment.ValueHelpDialog",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }
                
                this.nameDialog.then(function (oDialog) {
                    oDialog.getBinding("items").filter([new Filter("product_name", FilterOperator.Contains, InputValue)]);
                    console.log("SelectDialog items ->", oDialog.getItems());
                    console.log("SelectDialog id -> ",oDialog.getId());
                    oDialog.open(InputValue);
                });
            },
            onValueHelpSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                console.log("sValue -> ", sValue);
                var oFilter = new Filter("product_name", FilterOperator.Contains, sValue);

                oEvent.getSource().getBinding("items").filter([oFilter]);
            },
            onValueHelpClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
			    oEvent.getSource().getBinding("items").filter([]);

                if (!oSelectedItem) {
                    return;
                }

                this.byId("ReqGood").setValue(oSelectedItem.getTitle());
            },
    });
});