Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    myStore: undefined,
    myGrid: undefined,

    myFetch: [
        'DragAndDropRank',
        'FormattedID',
        'c_RAIDType',
        'Name',
        'Description',
        'Owner',
        'c_RAIDOwner',
        'c_RAIDRequestStatus',
        'c_RAIDDateIdentified',
        'c_RISKProbabilityLevel', // ONLY RISKS
        'c_RAIDSeverityCriticality',
        'c_RAIDEscalationLevels',
        'c_RAIDProgressComments',
        'Parent',
        'c_RAIDNavIDifdifferentfromParent',
        'c_RAIDPortfolioLevel',
        'c_RAIDDueDate',
    ],
    launch: function () {
        console.log('\033[2J');
        this._myMask = new Ext.LoadMask(Ext.getBody(), {
            msg: "Calculating...Please wait..."
        });
        this._myMask.show();
        var myViewPort = Ext.create('Ext.container.Viewport', {
            layout: 'border',
            itemId: 'viewPortID',
            testing: 'racook',
            items: [{
                    itemId: 'myRAIDTypeDropDownID',
                    region: 'north',
                    xtype: 'panel',
                    bodyPadding: 10,
                },
                {
                    region: 'center',
                    xtype: 'panel',
                    layout: {
                        type: 'accordion',
                        animate: true,
                        titleCollapse: true,
                        activeOnTop: true
                    },
                    items: [{
                        itemId: 'myGridID',
                        title: 'RAIDs',
                        xtype: 'panel',
                        autoScroll: true,
                        listeners: {
                            afterrender: function (panel) {
                                panel.getEl().addCls('custom-header-RAIDS');
                            }
                        }
                    }, {
                        itemId: 'myLegendID',
                        title: 'RAID Colours',
                        xtype: 'panel',
                        autoScroll: true,
                        html: this._grabLegend(),
                        bodyStyle: {
                            "background-color": "#1a1b1a",
                            "color": "#fafafa"
                        },
                        listeners: {
                            afterrender: function (panel) {
                                panel.getEl().addCls('custom-header-LEGEND');
                            },
                        }
                    }, {
                        itemId: 'myReleaseID',
                        title: 'Release Notes',
                        xtype: 'panel',
                        autoScroll: true,
                        html: this._grabRelease(),
                        listeners: {
                            afterrender: function (panel) {
                                panel.getEl().addCls('custom-header-RELEASE');
                            }
                        },
                        style: {
                            background: 'black'
                        }
                    }]
                }
            ]
        });
        var a = myViewPort.down('#myRAIDTypeDropDownID');
        var b = myViewPort.down('#myGridID');
        this.viewportRegionArray = [a, b];
        this._raidSelection(myViewPort);
    },

    _raidSelection: function (myViewPort) {
        var me = this;
        var states = Ext.create('Ext.data.Store', {
            fields: ['raidType'],
            data: [{
                    "raidType": "Risk"
                },
                {
                    "raidType": "Issue"
                },
                {
                    "raidType": "Assumption"
                },
                {
                    "raidType": "Dependency"
                }
            ]
        });
        var raidCombo = Ext.create('Ext.form.ComboBox', {
            fieldLabel: 'RAID Type',
            store: states,
            queryMode: 'local',
            displayField: 'raidType',
            valueField: 'raidType',
            value: 'Risk',
            itemId: 'raid-combobox',
            labelAlign: 'right',
            width: 300,
            listeners: {
                boxready: me._loadData,
                select: me._loadData,
                scope: me
            }
        });
        console.log(this.viewportRegionArray);
        console.log(myViewPort.down('#myNorthID'));
        this.viewportRegionArray[0].add(raidCombo);
    },
    _getFilters: function (value) {
        var myFilter = Ext.create('Rally.data.wsapi.Filter', {
            property: 'c_RAIDType',
            operation: '=',
            value: value
        });
        return myFilter;
    },
    _loadData: function () {
        var me = this;
        var filter = this.viewportRegionArray[0].down('#raid-combobox').rawValue;
        var myFilters = this._getFilters(filter);
        if (me.myStore) {
            console.log('STORE - Refreash');
            me.myStore.setFilter(myFilters);
            me.myStore.load();
            if (this.viewportRegionArray[0].down('#raid-combobox').rawValue === 'Risk') {
                console.log('STORE - Risk');
                Ext.ComponentQuery.query('.gridcolumn[dataIndex^="c_RISKProbabilityLevel"]')[0].show();
                //
                //
                // RAID CALC BASED ON RISK
                //
                //
            } else {
                console.log('STORE - Non Risk');
                Ext.ComponentQuery.query('.gridcolumn[dataIndex^="c_RISKProbabilityLevel"]')[0].hide();
                //
                //
                // RAID CALC BASED ON AIDS
                //
                //
            }
            me.myGrid.doLayout();
        } else {
            console.log('STORE - New');
            me.myStore = Ext.create('Rally.data.wsapi.artifact.Store', {
                models: 'PortfolioItem/Feature',
                autoLoad: true,
                limit: Infinity,
                filters: myFilters,
                listeners: {
                    load: function (myStore, myData) {
                        if (!me.myGrid) {
                            console.log('STORE - Loading Grid (First Time)');
                            this._createGrid(myStore, myData);
                        }
                    },
                    scope: me
                },
                fetch: this.myFetch
            });
        }
    },
    _createGrid: function (myStore, myData) {
        var me = this;
        me.myGrid = Ext.create('Ext.Container', {
            items: [{
                xtype: 'rallygrid',
                layout: {
                    style: 'border',
                },
                models: ['PortfolioItem/Feature'],
                store: myStore,
                bulkEditConfig: {
                    showEdit: true,
                    showTag: true,
                    showParent: true,
                    showRemove: true
                },
                context: this.getContext(),
                enableColumnMove: false,
                enableBulkEdit: true,
                enableRanking: true,
                enableColumnResize: true,
                sortableColumns: true,
                listeners: {
                    edit: function () {}
                },
                columnCfgs: [{

                        text: 'Rank',
                        dataIndex: 'DragAndDropRank',
                        width: 40,
                    },
                    {

                        text: 'ID',
                        dataIndex: 'FormattedID',
                        width: 120,
                    },
                    {
                        text: '[RAID] Type',
                        dataIndex: 'c_RAIDType',
                        renderer: function (value) {
                            this.raidRiskSwitch = value;
                            if (value === null || value === undefined)
                                return '';
                            return value;
                        }
                    },
                    {
                        text: 'Name',
                        dataIndex: 'Name',
                        flex: 1,
                        renderer: function (value) {
                            if (value === null || value === undefined)
                                return '';
                            return value;
                        }
                    },
                    {
                        text: 'Description',
                        dataIndex: 'Description',
                        renderer: function (value) {
                            if (value === null || value === undefined)
                                return '';
                            return value;
                        }
                    },
                    {
                        text: '[RAID] Owner',
                        dataIndex: 'c_RAIDOwner',
                        renderer: function (value) {
                            if (value === null || value === undefined)
                                return '';
                            return value;
                        }
                    },
                    {
                        text: 'Owner',
                        dataIndex: 'Owner',
                        renderer: function (value, meta) {
                            if (value === null || value === undefined)
                                return '';
                            return value._refObjectName;
                        }
                    },
                    {
                        text: '[RAID] Request Status',
                        dataIndex: 'c_RAIDRequestStatus',
                        renderer: function (value) {
                            this.temp_Closed_Perhaps_Maybe = value;
                            if (value === null || value === undefined)
                                return '';
                            return value;
                        }
                    },
                    {
                        text: '[RAID] Date Identified',
                        dataIndex: 'c_RAIDDateIdentified',
                        type: 'date',
                        renderer: function (value) {
                            if (value === null || value === undefined) {
                                this.temp_Date = 0;
                                return '';
                            } else {
                                this.temp_Date = value;
                                return value;
                            }
                        }
                    },
                    /////////////// RISK ONLY
                    {
                        text: '[RISK] Probability Level',
                        dataIndex: 'c_RISKProbabilityLevel',
                        renderer: function (value) {
                            this.temp_Probability = value;
                            if (value === null || value === undefined)
                                return '';
                            return value;
                        }

                    },
                    /////////////////////////////
                    {
                        text: '[RAID] Severity / Criticality',
                        dataIndex: 'c_RAIDSeverityCriticality',
                        renderer: function (value) {
                            this.temp_Severity = value;
                            if (value === null || value === undefined)
                                return '';
                            return value;
                        }
                    },
                    {
                        text: '[RAID] Escalation Levels',
                        dataIndex: 'c_RAIDEscalationLevels',
                        renderer: function (value) {
                            if (value === null || value === undefined)
                                return '';
                            return value;
                        }
                    },
                    {
                        text: '[RAID] Progress Comments',
                        dataIndex: 'c_RAIDProgressComments',
                        renderer: function (value) {
                            if (value === null || value === undefined)
                                return '';
                            return value;
                        }
                    },
                    {
                        text: 'Parent',
                        dataIndex: 'Parent',
                        renderer: function (value) {
                            if (value === null || value === undefined)
                                return '';
                            return value.Name;
                        }
                    },
                    {
                        text: '[RAID] ID If Different From Parent',
                        dataIndex: 'c_RAIDNavIDifdifferentfromParent',
                        renderer: function (value) {
                            if (value === null || value === undefined)
                                return '';
                            return value;
                        }
                    }, {
                        text: '[RAID] Portfolio Level?',
                        dataIndex: 'c_RAIDPortfolioLevel',
                        renderer: function (value) {
                            var output = [];
                            for (var x = 0; x < value._tagsNameArray.length; x++) {
                                output = output + value._tagsNameArray[x].Name + '</br>';
                            }
                            return output;
                        }
                    }, {
                        text: '[RAID] Due Date',
                        dataIndex: 'c_RAIDDueDate',
                        type: 'date',
                        renderer: function (value) {
                            if (value === null || value === undefined) {
                                this.temp_Date_Due = 0;
                                return '';
                            } else {
                                this.temp_Date_Due = value;
                                return value;
                            }
                        }
                    },
                    {
                        text: '[RAID] Days Past Due Date',
                        dataIndex: 'c_RAIDDueDate',
                        renderer: function (value) {
                            var days;
                            if (this.temp_Closed_Perhaps_Maybe === 'Closed' || this.temp_Closed_Perhaps_Maybe === 'Cancelled') {
                                days = 'Closed / Cancelled';
                            } else {
                                var t1 = value;
                                var now = new Date().valueOf();
                                var ndays = (now - t1) / 1000 / 86400;
                                days = Math.round(ndays - 0.5);
                            }
                            if (value === null || value === undefined)
                                return '';
                            return days;

                        }
                    },
                    {
                        text: '[RAID] Days Not Closed',
                        dataIndex: 'c_RAIDDateIdentified',
                        renderer: function (value) {
                            var days;
                            if (this.temp_Closed_Perhaps_Maybe === 'Closed' || this.temp_Closed_Perhaps_Maybe === 'Cancelled') {
                                days = 'Closed / Cancelled';
                            } else {
                                var t1 = value;
                                var now = new Date().valueOf();
                                var ndays = (now - t1) / 1000 / 86400;
                                days = Math.round(ndays - 0.5);
                            }
                            if (value === null || value === undefined)
                                return '';
                            return days;
                        }
                    }, {
                        text: '[RAID] Calculated Colour',
                        dataIndex: '',
                        width: 80,
                        renderer: function (value) {
                            return me._raidColour(this.temp_Severity, this.temp_Probability, this.temp_Closed_Perhaps_Maybe);
                        }
                    }
                    /*
                    , {
                        text: 'Warnings',
                        dataIndex: '',
                        width: 80,
                        renderer: function(value) {
                            return me._errorColour(this.temp_Severity, this.temp_Probability, this.temp_Closed_Perhaps_Maybe)
                        }
                    }
                    */
                ],
            }]
        });
        console.log('GRID - Done');
        this.viewportRegionArray[1].add(me.myGrid);
        console.log('SPINNER - Done');
        this._myMask.hide();
    },
    _errorColour: function (a, b, c) {
        var css = '';
        var msg = '';
        if (!a) {
            console.warn('Missing Sev');
            css = "missing-severity";
        }
        if (!b) {
            console.warn('Missing Prob');
            css = "missing-probability";
        }
        // Missing
        if (!a && !b) {
            console.warn('Missing Prob Sev');
            css = 'missing-severity-probability';
        }
        return this._colourOutput(css, msg);
    },
    _raidColour: function (a, b, c) {
        var css = '';
        var msg = '';
        if (this.viewportRegionArray[0].down('#raid-combobox').rawValue === 'Risk') {
            if (c === 'Closed' || c === 'Cancelled') {
                css = "blue";
            } else {
                // Exceptional
                if (a === 'Exceptional') {
                    css = "red";
                }
                // High
                if (a === 'High' && b === 'Unlikely') {
                    css = "amber";
                }
                if (a === 'High' && b === 'Possible') {
                    css = "amber";
                }
                if (a === 'High' && b === 'Likely') {
                    css = "red";
                }
                if (a === 'High' && b === 'Certain') {
                    css = "red";
                }
                // Moderate
                if (a === 'Moderate' && b === 'Unlikely') {
                    css = "green";
                }
                if (a === 'Moderate' && b === 'Possible') {
                    css = "green";
                }
                if (a === 'Moderate' && b === 'Likely') {
                    css = "amber";
                }
                if (a === 'Moderate' && b === 'Certain') {
                    css = "amber";
                }
                // Low
                if (a === 'Low') {
                    css = "green";
                }

            }
        } else {
            console.warn('AID Mode at the algo');
            if (c === 'Closed' || c === 'Cancelled') {
                css = "blue";
            } else {
                if (!a || !b) {
                    css = "missing";
                }
                // Exceptional
                if (a === 'Exceptional') {
                    css = "red";
                }
                // High
                if (a === 'High') {
                    css = "amber";
                }
                // Moderate
                if (a === 'Moderate') {
                    css = "green";
                }
                // Low
                if (a === 'Low') {
                    css = "green";
                }
                // Missing
                if (!a) {
                    css = 'missing';
                }
            }
        }
        return this._colourOutput(css, msg);
    },
    _colourOutput: function (css, msg) {
        return '<div class="raidColours raidColours-' + css + '">' + msg + '</div>';
    },
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //

    _grabRelease: function () {
        var output = '<table border="0" cellspacing="2" cellpadding="2" class="tables">' +
            '<tbody>' +
            '<tr>' +
            '<td colspan="2">' +
            '<h1>Barclays RAID Log' +
            '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp</td>' +
            '<td>&nbsp</td>' +
            '</tr>' +
            '<tr>' +
            '<td width="228"><strong>Version</strong></td>' +
            '<td width="578">1.0</td>' +
            '</tr>' +
            '<tr>' +
            '<td><strong>Release Date</strong></td>' +
            '<td>2017-08-24 : 18:27</td>' +
            '</tr>' +
            '<tr>' +
            '<td><strong>Developer</strong></td>' +
            '<td>Richard Cook / DevTools Group</td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp</td>' +
            '<td>richard.cook@barclaycard.co.uk</td>' +
            '</tr>' +
            '<tr>' +
            '<td valign="top"><strong>Description</strong></td>' +
            '<td valign="top">' +
            '<p>RAID\s Analysis with colour indication and time based delta\s from (Due Date &amp; Identification Date)</p>' +
            '<p>Calculates RAID impact colour depending on RAID type:<br>' +
            '<br> R - Risk (Severity + Probability)<br> A - Assumption (Severity)' +
            '<br> I - Issue (Severity)<br> D - Dependency (Severity)' +
            '</p>' +
            '</td>' +
            '</tr>' +
            '<tr>' +
            '<td valign="top"><strong>Modus</strong></td>' +
            '<td valign="top">' +
            '<p>App.js : App.css</p>' +
            '<ol>' +
            '<li>Draw view-port' +
            '<ol>' +
            '<li>North - Drop-down [c_RAIDType]</li>' +
            '<li>Center - Accordion' +
            '<ol>' +
            '<li>RAID Grid</li>' +
            '<li>Legend</li>' +
            '<li>Release</li>' +
            '</ol>' +
            '</li>' +
            '</ol>' +
            '</li>' +
            '<li>Send Drop-down value to store filter (Risk, Assumption..)</li>' +
            '<li>Generate Store based on filter and generate GRID</li>' +
            '<li>Generate GRID</li>' +
            '<li>Generate Columns and style them</li>' +
            '<li>Calculate RAID colours based on RAID heat-map method</li>' +
            '<li>Evaluate RAID type, show / hide Probability column depending on R or AID</li>' +
            '<li>Draw GRID allocate to view-port -&gt; accordion</li>' +
            '</ol>' +
            '</td>' +
            '</tr>' +
            '<tr>' +
            '<td valign="top"><strong>Language</strong></td>' +
            '<td valign="top">JavaScript / CSS / HTML<br> Sencha ExtJS<br> Node JS (Rally App Builder) <br></td>' +
            '</tr>' +
            '</tbody>' +
            '</table>';
        return output;
    },

    _grabLegend: function () {
        var output = '<table border="0" cellspacing="0" cellpadding="2" class="tables" id="myTableNotYours">' +
            '<tbody>' +
            '<tr>' +
            '<td colspan="8"><h1>RAID Legend</td>' +
            '</tr>' +
            '<tr>' +
            '<td colspan="5">Risks</td>' +
            '<td colspan="3">Assumptions, Issues and Dependencies</td>' +
            '</tr>' +
            '<tr>' +
            '<th width="150">Severity</th>' +
            '<th width="150">Probability</th>' +
            '<th width="200">[RAID] Request Status</th>' +
            '<th width="100">Colour</th>' +
            '<th class="table-header-blank" width="15">&nbsp;</th>' +
            '<th width="150">Severity</th>' +
            '<th width="200">[RAID] Request Status</th>' +
            '<th width="100">Colour</th>' +
            '</tr>' +
            '<tr>' +
            '<td>Exceptional</td>' +
            '<td> (Exceptional Overides Probability)</td>' +
            '<td>Not (Closed / Cancelled)</td>' +
            '<td><div class="raidColours raidColours-red">&nbsp</div></td>' +
            '<td>&nbsp;</td>' +
            '<td>Exceptional</td>' +
            '<td>Not (Closed / Cancelled)</td>' +
            '<td><div class="raidColours raidColours-red">&nbsp</div></td>' +
            '</tr>' +
            '<tr>' +
            '<td>High</td>' +
            '<td>Certain</td>' +
            '<td>Not (Closed / Cancelled)</td>' +
            '<td><div class="raidColours raidColours-red">&nbsp</div></td>' +
            '<td>&nbsp;</td>' +
            '<td>High</td>' +
            '<td>Not (Closed / Cancelled)</td>' +
            '<td><div class="raidColours raidColours-red">&nbsp</div></td>' +
            '</tr>' +
            '<tr>' +
            '<td>High</td>' +
            '<td>Likely</td>' +
            '<td>Not (Closed / Cancelled)</td>' +
            '<td><div class="raidColours raidColours-red">&nbsp</div></td>' +
            '<td>&nbsp;</td>' +
            '<td>Moderate</td>' +
            '<td>Not (Closed / Cancelled)</td>' +
            '<td><div class="raidColours raidColours-amber">&nbsp</div></td>' +
            '</tr>' +
            '<tr>' +
            '<td>High</td>' +
            '<td>Unlikley</td>' +
            '<td>Not (Closed / Cancelled)</td>' +
            '<td><div class="raidColours raidColours-amber">&nbsp</div></td>' +
            '<td>&nbsp;</td>' +
            '<td>Low</td>' +
            '<td>Not (Closed / Cancelled)</td>' +
            '<td><div class="raidColours raidColours-green">&nbsp</div></td>' +
            '</tr>' +
            '<tr>' +
            '<td>High</td>' +
            '<td>Possible</td>' +
            '<td>Not (Closed / Cancelled)</td>' +
            '<td><div class="raidColours raidColours-amber">&nbsp</div></td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '</tr>' +
            '<tr>' +
            '<td>Moderate</td>' +
            '<td>Certain</td>' +
            '<td>Not (Closed / Cancelled)</td>' +
            '<td><div class="raidColours raidColours-amber">&nbsp</div></td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '</tr>' +
            '<tr>' +
            '<td>Moderate</td>' +
            '<td>Likely</td>' +
            '<td>Not (Closed / Cancelled)</td>' +
            '<td><div class="raidColours raidColours-amber">&nbsp</div></td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '</tr>' +
            '<tr>' +
            '<td>Moderate</td>' +
            '<td>Unlikely</td>' +
            '<td>Not (Closed / Cancelled)</td>' +
            '<td><div class="raidColours raidColours-green">&nbsp</div></td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '</tr>' +
            '<tr>' +
            '<td>Moderate</td>' +
            '<td>Possible</td>' +
            '<td>Not (Closed / Cancelled)</td>' +
            '<td><div class="raidColours raidColours-green">&nbsp</div></td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '</tr>' +
            '<tr>' +
            '<td>Low</td>' +
            '<td>(Low Overides Probability)</td>' +
            '<td>Not (Closed / Cancelled)</td>' +
            '<td><div class="raidColours raidColours-green">&nbsp</div></td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>Cancelled' +
            '<td><div class="raidColours raidColours-blue">&nbsp</div></td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>Cancelled' +
            '<td><div class="raidColours raidColours-blue">&nbsp</div></td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>Closed</td>' +
            '<td><div class="raidColours raidColours-blue">&nbsp</div></td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>Closed</td>' +
            '<td><div class="raidColours raidColours-blue">&nbsp</div></td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '</tr>' +
            '<tr>' +
            '<td>(Missing)</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td><div class="raidColours raidColours-missing-probability">&nbsp</div></td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '</tr>' +
            '<tr>' +
            '<td>&nbsp;</td>' +
            '<td>(Missing)</td>' +
            '<td>&nbsp;</td>' +
            '<td><div class="raidColours raidColours-missing-severity">&nbsp</div></td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '<td>&nbsp;</td>' +
            '</tr>' +
            '<tr>' +
            '<td>(Missing)</td>' +
            '<td>(Missing)</td>' +
            '<td>&nbsp;</td>' +
            '<td><div class="raidColours raidColours-missing-severity-probability">&nbsp</div></td>' +
            '<td>&nbsp;</td>' +
            '<td>(Missing)</td>' +
            '<td>&nbsp;</td>' +
            '<td><div class="raidColours raidColours-missing-severity-probability">&nbsp</div></td>' +
            '</tr>' +
            '</tbody>' +
            '</table>';
        return output;
    },
});