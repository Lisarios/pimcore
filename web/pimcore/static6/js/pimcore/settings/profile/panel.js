/**
 * Pimcore
 *
 * This source file is available under two different licenses:
 * - GNU General Public License version 3 (GPLv3)
 * - Pimcore Enterprise License (PEL)
 * Full copyright and license information is available in
 * LICENSE.md which is distributed with this source code.
 *
 * @copyright  Copyright (c) Pimcore GmbH (http://www.pimcore.org)
 * @license    http://www.pimcore.org/license     GPLv3 and PEL
 */

pimcore.registerNS("pimcore.settings.profile.panel");
pimcore.settings.profile.panel = Class.create({

    initialize: function () {

        this.getTabPanel();
    },

    getTabPanel: function () {

        if (!this.panel) {
            this.panel = new Ext.Panel({
                id: "my_profile",
                title: t("my_profile"),
                iconCls: "pimcore_icon_user",
                border: false,
                closable: true,
                layout: "fit",
                bodyStyle: "padding: 10px;",
                items: [this.getEditPanel()]
            });

            var tabPanel = Ext.getCmp("pimcore_panel_tabs");
            tabPanel.add(this.panel);
            tabPanel.setActiveItem("my_profile");

            this.panel.on("destroy", function () {
                pimcore.globalmanager.remove("profile");
            }.bind(this));


            pimcore.layout.refresh();

        }

        return this.panel;
    },

    getEditPanel: function () {
        this.forceReloadOnSave = false;
        this.currentUser = pimcore.currentuser;

        var passwordCheck = function (el) {
            if (/^(?=.*\d)(?=.*[a-zA-Z]).{6,100}$/.test(el.getValue())) {
                el.getEl().addCls("password_valid");
                el.getEl().removeCls("password_invalid");
            } else {
                el.getEl().addCls("password_invalid");
                el.getEl().removeCls("password_valid");
            }
        };

        var generalItems = [];

        generalItems.push({
            xtype: "textfield",
            fieldLabel: t("firstname"),
            name: "firstname",
            value: this.currentUser.firstname,
            width: 400
        });
        generalItems.push({
            xtype: "textfield",
            fieldLabel: t("lastname"),
            name: "lastname",
            value: this.currentUser.lastname,
            width: 400
        });


        generalItems.push({
            xtype: "textfield",
            fieldLabel: t("email"),
            name: "email",
            value: this.currentUser.email,
            width: 400
        });


        generalItems.push({
            xtype: 'combo',
            fieldLabel: t('language'),
            typeAhead: true,
            value: this.currentUser.language,
            mode: 'local',
            name: "language",
            listWidth: 100,
            store: pimcore.globalmanager.get("pimcorelanguages"),
            displayField: 'display',
            valueField: 'language',
            forceSelection: true,
            triggerAction: 'all',
            hiddenName: 'language',
            listeners: {
                change: function () {
                    this.forceReloadOnSave = true;
                }.bind(this),
                select: function () {
                    this.forceReloadOnSave = true;
                }.bind(this)
            }
        });

        generalItems.push({
            xtype: "checkbox",
            boxLabel: t("show_welcome_screen"),
            name: "welcomescreen",
            checked: this.currentUser.welcomescreen
        });

        generalItems.push({
            xtype: "checkbox",
            boxLabel: t("memorize_tabs"),
            name: "memorizeTabs",
            checked: this.currentUser.memorizeTabs
        });

        var passwordField = new Ext.form.field.Text({
            fieldLabel: t("new_password"),
            name: "new_password",
            inputType: "password",
            width: 400,
            enableKeyEvents: true,
            listeners: {
                keyup: passwordCheck
            }
        });

        var retypePasswordField = new Ext.form.field.Text({
            xtype: "textfield",
            fieldLabel: t("retype_password"),
            name: "retype_password",
            inputType: "password",
            width: 400,
            style: "margin-bottom: 20px;",
            enableKeyEvents: true,
            listeners: {
                keyup: passwordCheck
            }
        });

        generalItems.push({
            xtype: "fieldset",
            title: t("change_password"),
            items: [{
                xtype: "textfield",
                fieldLabel: t("old_password"),
                name: "old_password",
                inputType: "password",
                width: 400,
                hidden: this.currentUser.isPasswordReset
            }, {
                xtype: "fieldcontainer",
                layout: 'hbox',
                items: [

                    passwordField,
                    {
                        xtype: "button",
                        width: 32,
                        style: "margin-left: 8px",
                        iconCls: "pimcore_icon_clear_cache",
                        handler: function () {

                            var pass;

                            while (true) {
                                pass = pimcore.helpers.generatePassword(15);
                                if (pimcore.helpers.isValidPassword(pass)) {
                                    break;
                                }
                            }

                            passwordField.getEl().down('input').set({type: 'text'});

                            passwordField.setValue(pass);
                            retypePasswordField.setValue(pass);

                            passwordCheck(passwordField);
                            passwordCheck(retypePasswordField);
                        }.bind(this)
                    }
                ]
            }, retypePasswordField]
        });

        var twoFactorSettings = new pimcore.settings.profile.twoFactorSettings(this.currentUser.twoFactorAuthentication);
        generalItems.push(twoFactorSettings.getPanel());


        var date = new Date();

        var image = "/admin/user/get-image?id=" + this.currentUser.id + "&_dc=" + date.getTime();
        generalItems.push({
            xtype: "fieldset",
            title: t("image"),
            width: '100%',
            items: [{
                xtype: "container",
                id: "pimcore_profile_image_" + this.currentUser.id,
                html: '<img src="' + image + '" />',
                width: 45,
                height: 45,
                style: "float:left; margin-right: 10px;"
            }, {
                xtype: "button",
                text: t("upload"),
                handler: function () {
                    pimcore.helpers.uploadDialog("/admin/user/upload-current-user-image?id="
                        + this.currentUser.id, null, function () {
                        var cont = Ext.getCmp("pimcore_profile_image_" + this.currentUser.id);
                        var date = new Date();
                        cont.update('<img src="/admin/user/get-image?id=' + this.currentUser.id + '&_dc='
                            + date.getTime() + '" />');
                    }.bind(this));
                }.bind(this)
            }]
        });

        this.editorSettings = new pimcore.settings.user.editorSettings(this, this.currentUser.contentLanguages);

        this.basicPanel = new Ext.form.FormPanel({
            border: false,
            items: [{items: generalItems}, this.editorSettings.getPanel()],
            labelWidth: 130
        });


        this.keyBindings = new pimcore.settings.user.user.keyBindings(this, true);

        this.userPanel = new Ext.Panel({
            autoScroll: true,
            items: [this.basicPanel, {
                xtype: "fieldset",
                collapsible: true,
                title: t("key_bindings"),
                items: [this.keyBindings.getPanel()]
            }],
            buttons: [
                {
                    text: t("save"),
                    iconCls: "pimcore_icon_apply",
                    handler: this.saveCurrentUser.bind(this)
                }
            ]
        });


        return this.userPanel;
    },

    saveCurrentUser: function () {
        var values = this.basicPanel.getForm().getFieldValues();
        var contentLanguages = this.editorSettings.getContentLanguages();
        values.contentLanguages = contentLanguages;

        if (values["new_password"]) {
            if (!pimcore.helpers.isValidPassword(values["new_password"]) || values["new_password"] != values["retype_password"]) {
                delete values["new_password"];
                delete values["retype_password"];
                Ext.MessageBox.alert(t('error'), t("password_was_not_changed"));
            }
        }

        try {
            var keyBindings = Ext.encode(this.keyBindings.getValues());
        } catch (e3) {
            console.log(e3);
        }



        Ext.Ajax.request({
            url: "/admin/user/update-current-user",
            method: "PUT",
            params: {
                id: this.currentUser.id,
                data: Ext.encode(values),
                keyBindings: keyBindings
            },
            success: function (response) {
                try {
                    var res = Ext.decode(response.responseText);
                    if (res.success) {

                        if (this.forceReloadOnSave) {
                            this.forceReloadOnSave = false;

                            Ext.MessageBox.confirm(t("info"), t("reload_pimcore_changes"), function (buttonValue) {
                                if (buttonValue == "yes") {
                                    window.location.reload();
                                }
                            }.bind(this));
                        }

                        pimcore.helpers.showNotification(t("success"), t("user_save_success"), "success");
                        if (contentLanguages) {
                            pimcore.settings.websiteLanguages = contentLanguages;
                            pimcore.currentuser.contentLanguages = contentLanguages.join(',');
                        }
                    } else {
                        pimcore.helpers.showNotification(t("error"), t("user_save_error"), "error", t(res.message));
                    }
                } catch (e) {
                    pimcore.helpers.showNotification(t("error"), t("user_save_error"), "error");
                }
            }.bind(this)
        });
    },

    activate: function () {
        Ext.getCmp("pimcore_panel_tabs").setActiveItem("my_profile");
    }
});