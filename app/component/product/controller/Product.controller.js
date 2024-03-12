sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "../model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/ui/model/Sorter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
],  function (Controller, formatter, Filter, FilterOperator, Fragment, Sorter, JSONModel, Spreadsheet, exportLibrary, MessageToast, MessageBox) {
        "use strict";

        let totalNumber;
        const EdmType = exportLibrary.EdmType;

        return Controller.extend("project1.component.product.controller.Product", {
            formatter: formatter,

            onInit: async function () {
                const myRoute = this.getOwnerComponent().getRouter().getRoute("Product");
                myRoute.attachPatternMatched(this.onMyRoutePatternMatched, this);
            },
            onMyRoutePatternMatched: async function () {
                this.onClearField();

                this.onDataView();
            },
            onDataView: async function () {
                const Product = await $.ajax({
                    type: "get",
                    url: "../odata/v4/product/Product"
                });

                let ProductModel = new JSONModel(Product.value);
                this.getView().setModel(ProductModel, "ProductModel");

                totalNumber = this.getView().getModel("ProductModel").oData.length;

                this.TableListChage(totalNumber);
            },
            TableListChage: function (data) {
                let TableIndex = "물품 요청 목록 ( " + data + " )";
                this.getView().byId("TableName").setText(TableIndex);
            },
            onValueHelpProduct: function (oEvent) {
                var oView = this.getView();
                var InputValue = oEvent.getSource().getValue();

                console.log("ProductModel ->", this.getView().getModel("ProductModel").getData());
                
                if (!this.nameDialog) {
                    this.nameDialog = sap.ui.core.Fragment.load({
                        id: oView.getId(),
                        name: "project1.component.product.view.fragment.ValueHelpDialog",
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

                this.byId("ProductName").setValue(oSelectedItem.getTitle());
            },
            onSearch: function() {
                let ProductId = this.byId("ProductId").getValue();
                let ProductName = this.byId("ProductName").getValue();
                let ProductDateStart = this.byId("ProductDateStart").getValue().slice(0, -1);
                let ProductDateEnd = this.byId("ProductDateEnd").getValue().slice(0, -1);
                let ProductPriceStart = this.byId("ProductPriceStart").getValue();
                let ProductPriceEnd = this.byId("ProductPriceEnd").getValue();

                if (isNaN(parseInt(ProductId, 10)) && ProductId) {
                    MessageBox.show("물품 번호는 숫자여야 합니다.\n다시 입력해주세요.");
                    this.onClearField();
                    return;
                }

                if (ProductPriceEnd && ProductPriceEnd < 1) {
                    MessageBox.show("최대 가격 범위는 0보다 낮을수 없습니다.\n다시 입력해주세요.");
                    this.onClearField();
                    return;
                }

                if (ProductPriceStart > ProductPriceEnd){
                    MessageBox.show("가격 범위가 잘못되었습니다.");
                    this.onClearField();
                    return;
                }
                if (isNaN(parseInt(ProductPriceStart, 10)) && ProductPriceStart) {
                    MessageBox.show("가격 범위는 숫자여야 합니다.\n다시 입력해주세요.");
                    this.onClearField();
                    return;
                }
                if (isNaN(parseInt(ProductPriceEnd, 10)) && ProductPriceEnd) {
                    MessageBox.show("가격 범위는 숫자여야 합니다.\n다시 입력해주세요.");
                    this.onClearField();
                    return;
                } 

                try {
                    if (ProductDateStart) {
                        let dateParts = ProductDateStart.split(". ");
                        let PrYear = dateParts[0];
                        let PrMonth = dateParts[1].padStart(2, '0');
                        let PrDay = dateParts[2].split('-')[0].padStart(2, '0');
                        ProductDateStart = PrYear + "-" + PrMonth + "-" + PrDay;
                    }
                    
                    if (ProductDateEnd) {
                        let dateParts = ProductDateEnd.split(". ");
                        let PrYear = dateParts[0];
                        let PrMonth = dateParts[1].padStart(2, '0');
                        let PrDay = dateParts[2].split('-')[0].padStart(2, '0');
                        ProductDateEnd = PrYear + "-" + PrMonth + "-" + PrDay;
                    }
                    if (ProductDateStart && ProductDateEnd) {
                        if (ProductDateStart > ProductDateEnd) {
                            MessageBox.show("날짜 범위가 잘못되었습니다.");
                            this.onClearField();
                            return;
                        }
                    }
                } catch (erreor) {
                    MessageBox.show("양식에 맞춰 날짜를 입력해주세요\n(ex) 2024-12-25, 20241225");
                    this.onClearField();
                    return;
                }
                
                console.log("productDateStart", "20" + ProductDateStart);
                console.log("ProductDateEnd", "20" + ProductDateEnd);


                var aFilter = [];
                
                if (ProductId) {
                    aFilter.push(new Filter("product_id", FilterOperator.Contains, ProductId));
                }
                if (ProductName) {
                    aFilter.push(new Filter("product_name", FilterOperator.Contains, ProductName));
                }
                if (ProductDateStart && ProductDateEnd) {
                    aFilter.push(new Filter("product_date", FilterOperator.BT, "20" + ProductDateStart, "20" + ProductDateEnd));
                } else if (ProductDateStart) {
                    aFilter.push(new Filter("product_date", FilterOperator.GE, "20" + ProductDateStart));
                } else if (ProductDateEnd) {
                    aFilter.push(new Filter("product_date", FilterOperator.LE, "20" + ProductDateEnd));
                }
                if (ProductPriceStart && ProductPriceEnd) {
                    aFilter.push(new Filter("product_price", FilterOperator.BT, ProductPriceStart, ProductPriceEnd));
                } else if (ProductPriceStart) {
                    aFilter.push(new Filter("product_price", FilterOperator.GE, ProductPriceStart));
                } else if (ProductPriceEnd) {
                    aFilter.push(new Filter("product_price", FilterOperator.LE, ProductPriceEnd));
                }
                
                let oTable = this.byId("ProductTable").getBinding("items");
                oTable.filter(aFilter);
                totalNumber = oTable.getLength();
                this.TableListChage(totalNumber);
            },
            onReset: function() {
                this.onClearField();
                this.onSearch();
            },
            onSort: function() {
                if (!this.byId("SortDialog")) {
                    Fragment.load({
                        id: this.getView().getId(),
                        name: "project1.component.product.view.fragment.SortDialog",
                        controller: this
                    }).then(function (oDialog) {
                        this.getView().addDependent(oDialog);
                        oDialog.open("filter");
                    }.bind(this));
                } else {
                    this.byId("SortDialog").open("filter");
                }
                this.onSearch();
            },
            onConfirmSortDialog: function (oEvent) {
                let mParams = oEvent.getParameters();
                let sPath = mParams.sortItem.getKey();
                let bDescending = mParams.sortDescending;
                let aSorters = [];

                aSorters.push(new Sorter(sPath, bDescending));
                let oTable = this.byId("ProductTable");
                let oBinding = oTable.getBinding("items");
                oBinding.sort(aSorters);
            },
            onCreateProduct: function() {
                let CreateOrder = this.getView().getModel("ProductModel").oData;
                let CreateOrderIndex = CreateOrder.length;
                let CreateNum = CreateOrder[CreateOrderIndex - 1].product_id + 1;
                console.log(CreateNum);
                this.getOwnerComponent().getRouter().navTo("Product_create", { num: CreateNum});
            },
            onDeleteDialog: function () {
                var oView = this.getView();

                if (!this.nameDialog) {
                    this.nameDialog = sap.ui.core.Fragment.load({
                        id: oView.getId(),
                        name: "project1.component.product.view.fragment.DeleteDialog",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }
                if (this.onDeleteCheck() === 0) {
                    MessageBox.show("삭제할 목록을 선택해주세요.");
                    return;
                } else {
                    this.nameDialog.then(function (oDialog) {
                        oDialog.open();
                    });
                }
            },
            onDeleteCheck: function () {
                let model = this.getView().getModel("ProductModel");
                let cnt = 0;
                for (let i = 0; i < totalNumber; i++) {
                    let chk = '/' + i + '/CHK'
                    if (model.getProperty(chk) === true) {
                        cnt++;
                    }
                }
                return cnt;
            },
            onCancelDeleteDialog: function () {
                this.byId("DeleteDialog").destroy();
                this.nameDialog = null;
            },
            onDeleteProduct: async function () {
                let model = this.getView().getModel("ProductModel");
                for (let i = 0; i < totalNumber; i++) {
                    let chk = '/' + i + '/CHK'
                    if (model.getProperty(chk) === true) {
                        let key = '/' + i + '/product_id';
                        let product_id = model.getProperty(key);
                        await this.onDelete(product_id);
                    }
                }
                this.onDataView();
                this.onCancelDeleteDialog();
                MessageToast.show("삭제되었습니다.");
            },
            onDelete: async function (key) {
                let url = "../odata/v4/product/Product/" + key;
                await fetch(url, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json;IEEE754Compatible=true"
                    }
                });
            },
            onClearField: function () {
                let ProductId = this.byId("ProductId").setValue("");
                let ProductName = this.byId("ProductName").setValue("");
                let ProductDateStart = this.byId("ProductDateStart").setValue("");
                let ProductDateEnd = this.byId("ProductDateEnd").setValue("");
                let ProductPriceStart = this.byId("ProductPriceStart").setValue("");
                let ProductPriceEnd = this.byId("ProductPriceEnd").setValue("");
            },
            
            onNavToDetail: function (oEvent) { // 수정필요
                let oSelectedItem = oEvent.getParameter("listItem") || oEvent.getSource();
                let oBindingContext = oSelectedItem.getBindingContext("ProductModel");
                
                if (oBindingContext) {
                    let sSelectedNum = oBindingContext.getProperty("product_id");
                    this.getOwnerComponent().getRouter().navTo("ProductDetail", { num: sSelectedNum });
                    console.log(sSelectedNum);
                }
            },
            onProducthome: function () {
                this.getOwnerComponent().getRouter().navTo("Product_home");
            }
            ,
            onDataExport: function () {
                let aCols, oRowBinding, oSettings, oSheet, oTable;

                oTable = this.byId('ProductTable');
                oRowBinding = oTable.getBinding('items');
                aCols = this.createColumnConfig();

                let oList = [];
                for (let i = 0; i < oRowBinding.oList.length; i++) {
                    if (oRowBinding.aIndices.indexOf(i) > -1) {
                        oList.push(oRowBinding.oList[i]);
                    }
                }
                oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: 'Level'
                    },
                    dataSource: oList,
                    fileName: 'ProductTable.xlsx',
                    worker: false
                };

                oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function () {
                    oSheet.destroy();
                })
            },
            createColumnConfig: function () {
                const aCols = [];

                aCols.push({
                    label: '요청 번호',
                    property: 'product_id',
                    type: EdmType.Int32
                });
                aCols.push({
                    label: '요청 물품',
                    property: 'product_name',
                    type: EdmType.String
                });
                aCols.push({
                    label: '물품 가격',
                    property: 'product_price',
                    type: EdmType.String
                });
                aCols.push({
                    label: '물품 등록 일자',
                    property: 'product_date',
                    type: EdmType.String
                });

                return aCols;
            }

    });
});