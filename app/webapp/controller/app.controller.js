sap.ui.define([
    "sap/ui/core/mvc/Controller",
],
function (Controller) {
    "use strict";

    return Controller.extend("project1.controller.app", {

        onRequest: function () {
            this.getOwnerComponent().getRouter().navTo("request");
        },
        onHome: function () {
            this.getOwnerComponent().getRouter().navTo("home");
        },
        onProduct: function () {
            this.getOwnerComponent().getRouter().navTo("product");
        }
    });
});