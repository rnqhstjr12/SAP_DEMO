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

        return Controller.extend("project1.component.request.controller.Request", {
            formatter: formatter,

            onInit: async function () {
                const myRoute = this.getOwnerComponent().getRouter().getRoute("Request");
                myRoute.attachPatternMatched(this.onMyRoutePatternMatched, this);
            },
            onMyRoutePatternMatched: async function () {
                this.onClearField();

                this.onDataView();
            },
            onDataView: async function () {
                const Request = await $.ajax({
                    type: "get",
                    url: "../odata/v4/request/Request"
                });

                let RequestModel = new JSONModel(Request.value);
                this.getView().setModel(RequestModel, "RequestModel");

                totalNumber = this.getView().getModel("RequestModel").oData.length;

                this.TableListChage(totalNumber);

                const Product = await $.ajax({
                    type: "get",
                    url: "../odata/v4/product/Product"
                });
                console.log(Product.value);
                let ProductModel = new JSONModel(Product.value);
                this.getView().setModel(ProductModel, "ProductModel");
            },
            TableListChage: function (data) {
                let TableIndex = "물품 요청 목록 ( " + data + " )";
                this.getView().byId("TableName").setText(TableIndex);
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
            onSearch: function() {
                let ReqNum = this.byId("ReqNum").getValue();
                let ReqGood = this.byId("ReqGood").getValue();
                let Requester = this.byId("Requester").getValue();
                let ReqDateStart = this.byId("ReqDateStart").getValue().slice(0, -1);
                let ReqDateEnd = this.byId("ReqDateEnd").getValue().slice(0, -1);
                let ReqStatus = this.byId("ReqStatus").getSelectedKey();
                let ReqPriceStart = this.byId("ReqPriceStart").getValue();
                let ReqPriceEnd = this.byId("ReqPriceEnd").getValue();
                
                if (isNaN(parseInt(ReqNum, 10)) && ReqNum) {
                    MessageBox.show("요청 번호는 숫자여야 합니다.\n다시 입력해주세요.");
                    this.onClearField();
                    return;
                }

                if (ReqPriceStart > ReqPriceEnd) {
                    MessageBox.show("가격 범위가 잘못되었습니다.");
                    this.onClearField();
                    return;
                }
                if (ReqPriceEnd && ReqPriceEnd < 1) {
                    MessageBox.show("최대 가격 범위는 0보다 낮을수 없습니다.\n다시 입력해주세요.");
                    this.onClearField();
                    return;
                } 
                if (isNaN(parseInt(ReqPriceStart, 10)) && ReqPriceStart) {
                    MessageBox.show("가격 범위는 숫자여야 합니다.\n다시 입력해주세요.");
                    this.onClearField();
                    return;
                }
                if (isNaN(parseInt(ReqPriceEnd, 10)) && ReqPriceEnd) {
                    MessageBox.show("가격 범위는 숫자여야 합니다.\n다시 입력해주세요.");
                    this.onClearField();
                    return;
                }

                if (Requester) {
                    const regexString = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/;
                    if (regexString.test(Requester) || !isNaN(parseInt(Requester, 10))) {
                        MessageBox.show("이름엔 숫자 또는 특수문자가 포함될수 없습니다.\n다시 입력해주세요.")
                        this.onClearField();
                        return;
                    }
                }

                try {
                    if (ReqDateStart) {
                        let dateParts = ReqDateStart.split(". ");
                        let ReqYear = dateParts[0];
                        let ReqMonth = dateParts[1].padStart(2, '0');
                        let ReqDay = dateParts[2].split('-')[0].padStart(2, '0');
                        ReqDateStart = ReqYear + "-" + ReqMonth + "-" + ReqDay;
                    }
                    
                    if (ReqDateEnd) {
                        let dateParts = ReqDateEnd.split(". ");
                        let ReqYear = dateParts[0];
                        let ReqMonth = dateParts[1].padStart(2, '0');
                        let ReqDay = dateParts[2].split('-')[0].padStart(2, '0');
                        ReqDateEnd = ReqYear + "-" + ReqMonth + "-" + ReqDay;
                    }
                    if (ReqDateStart && ReqDateEnd) {

                        if (ReqDateStart > ReqDateEnd) {
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
                
                console.log("20" + ReqDateStart);
                console.log("20" + ReqDateEnd);


                var aFilter = [];
                
                if (ReqNum) {
                    aFilter.push(new Filter("request_number", FilterOperator.EQ, ReqNum));
                }
                if (ReqGood) {
                    aFilter.push(new Filter("request_product", FilterOperator.Contains, ReqGood));
                }
                if (Requester) {
                    aFilter.push(new Filter("requestor", FilterOperator.Contains, Requester));
                }
                if (ReqDateStart && ReqDateEnd) {
                    aFilter.push(new Filter("request_date", FilterOperator.BT,"20" + ReqDateStart, "20" + ReqDateEnd));
                } else if (ReqDateStart) {
                    aFilter.push(new Filter("request_date", FilterOperator.GE, "20" + ReqDateStart));
                } else if (ReqDateEnd) {
                    aFilter.push(new Filter("request_date", FilterOperator.LE, "20" + ReqDateEnd));
                }
                if (ReqStatus) {
                    aFilter.push(new Filter("request_state", FilterOperator.Contains, ReqStatus));
                }
                if (ReqPriceStart && ReqPriceEnd) {
                    aFilter.push(new Filter("request_estimated_price", FilterOperator.BT, ReqPriceStart, ReqPriceEnd));
                } else if (ReqPriceStart) {
                    aFilter.push(new Filter("request_estimated_price", FilterOperator.GE, ReqPriceStart));
                } else if (ReqPriceEnd) {
                    aFilter.push(new Filter("request_estimated_price", FilterOperator.LE, ReqPriceEnd));
                }
                
                let oTable = this.byId("RequestTable").getBinding("rows");
                oTable.filter(aFilter);
                console.log(oTable.getLength());
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
                        name: "project1.component.request.view.fragment.SortDialog",
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
                let oBinding = this.byId("RequestTable").getBinding("rows");
                oBinding.sort(aSorters);
            },
            onCreateOrder: function() {
                let CreateOrder = this.getView().getModel("RequestModel").oData;
                let CreateOrderIndex = CreateOrder.length;
                let CreateNum = CreateOrder[CreateOrderIndex - 1].request_number + 1;

                this.getOwnerComponent().getRouter().navTo("CreateOrder", { num: CreateNum});
            },
            onDeleteDialog: function () {
                var oView = this.getView();

                if (!this.nameDialog) {
                    this.nameDialog = sap.ui.core.Fragment.load({
                        id: oView.getId(),
                        name: "project1.component.request.view.fragment.DeleteDialog",
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
                let model = this.getView().getModel("RequestModel");
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
            onDeleteOrder: async function () {
                let model = this.getView().getModel("RequestModel");
                for (let i = 0; i < totalNumber; i++) {
                    let chk = '/' + i + '/CHK'
                    if (model.getProperty(chk) === true) {
                        let key = '/' + i + '/request_number';
                        let request_number = model.getProperty(key);
                        await this.onDelete(request_number);
                    }
                }
                this.onDataView();
                this.onCancelDeleteDialog();
                MessageToast.show("삭제되었습니다.");
            },
            onDelete: async function (key) {
                let url = "../odata/v4/request/Request/" + key;
                await fetch(url, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json;IEEE754Compatible=true"
                    }
                });
            },
            onClearField: function () {
                let ReqNum = this.byId("ReqNum").setValue("");
                let ReqGood = this.byId("ReqGood").setValue("");
                let Requester = this.byId("Requester").setValue("");
                let ReqDateStart = this.byId("ReqDateStart").setValue("");
                let ReqDateEnd = this.byId("ReqDateEnd").setValue("");
                let ReqStatus = this.byId("ReqStatus").setSelectedKey("");
                let ReqPriceStart = this.byId("ReqPriceStart").setValue("");
                let ReqPriceEnd = this.byId("ReqPriceEnd").setValue("");
            },
            onShowRejectReason: function (oEvent) {
                // let oTable = this.getView().byId("RequestTable");
                // let firstRow = oTable.getFirstVisibleRow();
                // let SelectedNumID = oEvent.getParameters().id.slice(-2);
                // let SelectedIndex = parseInt(SelectedNumID / 9) + firstRow;

                // if (isNaN(SelectedNumID)) {
                //     SelectedIndex = firstRow;
                // }
                
                console.log(oEvent.getSource().getBindingContext("RequestModel").getProperty());
                // console.log(oEvent.getParameters().id);
                // console.log(SelectedNumID);
                // console.log(SelectedIndex);

                let RejectReason = oEvent.getSource().getBindingContext("RequestModel").getProperty().request_reject_reason;

                var oView = this.getView();

                if (!this.nameDialog) {
                    this.nameDialog = sap.ui.core.Fragment.load({
                        id: oView.getId(),
                        name: "project1.component.request.view.fragment.ShowRejectDialog",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        return oDialog;
                    });
                }
                this.nameDialog.then(function (oDialog) {
                    oDialog.open();
                    oView.byId("RejectReasonCheck").setText(RejectReason);
                });
            },
            onCancelRejectReason: function () {
                this.byId("ShowRejectDialog").destroy();
                this.nameDialog = null;
            },
            onNavToDetail: function (oEvent) {
                let SelectedNum = oEvent.getParameters().row.mAggregations.cells[1].mProperties.text;
                this.getOwnerComponent().getRouter().navTo("OrderDetail", { num: SelectedNum });
                console.log(SelectedNum);
            },
            onRequesthome: function () {
                this.getOwnerComponent().getRouter().navTo("Request_home");
            }
            ,
            onDataExport: function () {
                let aCols, oRowBinding, oSettings, oSheet, oTable;

                oTable = this.byId('RequestTable');
                oRowBinding = oTable.getBinding('rows');
                aCols = this.createColumnConfig();

                let oList = [];
                for (let i = 0; i < oRowBinding.oList.length; i++) {
                    if (oRowBinding.aIndices.indexOf(i) > -1) {
                        oList.push(oRowBinding.oList[i]);
                    }
                }
                for (let i = 0; i < oList.length; i++) {
                    if (oList[i].request_state === 'A') {
                        oList[i].request_state = '승인';
                    }
                    if (oList[i].request_state === 'B') {
                        oList[i].request_state = '처리 대기';
                    }
                    if (oList[i].request_state === 'C') {
                        oList[i].request_state = '반려';
                    }
                }
                oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: 'Level'
                    },
                    dataSource: oList,
                    fileName: 'RequestTable.xlsx',
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
                    property: 'request_number',
                    type: EdmType.Int32
                });
                aCols.push({
                    label: '요청 물품',
                    property: 'request_product',
                    type: EdmType.String
                });
                aCols.push({
                    label: '물품 개수',
                    property: 'request_quantity',
                    type: EdmType.Int32
                });
                aCols.push({
                    label: '요청자',
                    property: 'requestor',
                    type: EdmType.String
                });
                aCols.push({
                    label: '요청 일자',
                    property: 'request_date',
                    type: EdmType.String
                });
                aCols.push({
                    label: '처리 상태',
                    property: 'request_state',
                    type: EdmType.String
                });

                return aCols;
            }

    });
});