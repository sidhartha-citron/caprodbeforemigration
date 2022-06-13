/* global d3, autocloser, mergeObjects, Control, bindContext, TWClass, $ */
/* jshint sub: true, nonew: false, scripturl: true */
if (tw === undefined) {
    var tw = {};
}
if (tw.viz === undefined) {
    tw.viz = {};
}

// User ("manual") grouping for nodes.
//
// Requires SelectionMixIn and CollectionsMixIn.
//
// This currently is an EXPERIMENTAL BETA FEATURE.
//
tw.viz.UserGroupingMixIn = TWClass.create({

    COLLECTION_KIND_USER        : "UserCollection",
    COLLECTION_KIND_USER_LABEL  : "User Collection",
    COLLECTION_TYPE_USER        : "user",       // denotes a user-made collection

    // prefixes for IDs of user-made hulls and collections
    // the ID is the prefix + sequence number, e.g. "user_hull_1"
    USER_HULL_ID_PREFIX         : "user_hull_",
    // user collection id should be an even-length string
    USER_COLLECTION_ID_PREFIX   : "collection_",

    // modal window for renaming collections
    rename_modal                : undefined,

    // Initialize the user grouping mixin.
    // This needs to be called before any functionality is used!
    //
    initUserGrouping : function () {
        "use strict";

        // copy the shape for unknown node kind and register the label
        // TODO beta feature
        if (tw.viz.DEFAULT_SHAPES[this.COLLECTION_KIND_USER] === undefined) {
            var unknown = tw.viz.DEFAULT_SHAPES[""];

            tw.viz.DEFAULT_SHAPES[this.COLLECTION_KIND_USER] = [
                this.COLLECTION_KIND_USER_LABEL, unknown[1], unknown[2]
            ];
        }
    },

    // Return an array of ids for user-made hulls. This includes removed hulls.
    //
    getUserHulls : function () {
        "use strict";

        var user_hulls = [];

        Object.keys(this.hulls).forEach(function (hull_id) {
            if (hull_id.search(this.USER_HULL_ID_PREFIX) === 0) {
                user_hulls.push(hull_id);
            }
        }, this);

        return user_hulls;
    },

    // Return an array of ids for user-made collections. This includes
    // removed ones.
    //
    getUserCollections : function () {
        "use strict";

        var user_collections = [];

        this.all_nodes.forEach(function (node) {
            if (this.isCollectionNode(node) &&
                    node.collection_type === this.COLLECTION_TYPE_USER) {
                user_collections.push(node.id);
            }
        }, this);

        return user_collections;
    },

    addUserGroupingContextMenuItems : function () {
        "use strict";

        if (this.countSelected === undefined) {
            console.error("Internal Error: Can't add user grouping " +
                          "context menu items without selection mixin");
            return;
        }

        var objref                  = this,     // avoid nested bindContexts
            get_hull_condition      = function (text) {
                return function () {
                    // require non-empty selection and selection not being
                    // an existing hull to create a new one
                    if (objref.countSelected() > 1 && !objref.selectedInUserHull()) {
                        return text;
                    }

                };
            },
            collection_condition    = function () {
                if (objref.countSelected() > 1) {
                    return "BETA: Collapse into collection";
                }
            },
            collection_rename_condition = function (datum, target) {
                // single node context only
                if (datum.collection_type === objref.COLLECTION_TYPE_USER) {
                    return "BETA: Rename collection";
                }
            },

            menu_items = [
                // separator
                null,

                // hulls
                [
                    get_hull_condition("BETA: Group visually (keep links)"),
                    get_hull_condition("BETA: Group visually (keep links)"),
                    bindContext(this, this.createUserHullKeepLinks)
                ],

                [
                    get_hull_condition("BETA: Group visually (hide links)"),
                    get_hull_condition("BETA: Group visually (hide links)"),
                    bindContext(this, this.createUserHull)
                ],


                // user collections
                [
                    collection_condition,
                    collection_condition,
                    bindContext(this, this.createUserCollection)
                ],

                [
                    "BETA: Expand all visible collections",
                    true,
                    bindContext(this, this._expandAllCollectionsAction)
                ]
            ],

            rename_collection = [
                [
                    collection_rename_condition,
                    collection_rename_condition,
                    bindContext(this, this.renameUserCollectionAction)
                ]
            ];


        this.CONTEXT_MENU_ITEMS["background"] = (
            this.CONTEXT_MENU_ITEMS["background"].concat(menu_items)
        );

        var menu_items_with_rename = menu_items.concat(rename_collection);

        this.CONTEXT_MENU_ITEMS["node"] = (
            this.CONTEXT_MENU_ITEMS["node"].concat(menu_items_with_rename)
        );
    },

    //
    // HULLS
    // =====

    // Create a new user node group from selected nodes.
    //
    createUserHull : function (keep_links) {
        "use strict";

        if (keep_links === undefined) {
            keep_links = false;
        }

        // create a new user group and put the nodes into a new hull
        var selected_ids = this.getSelectedIds(),
            hull_id      = this._getNewUserHullId();

        this._beforeSetState();

        selected_ids.forEach(function(node_id) {
            var node = this.nodes_map[node_id];
            this._addNodeToUserHull(node, hull_id);
        }, this);

        this._processLinksInUserHull(hull_id, keep_links);

        // recalculate layout, show the created hulls, etc
        this._afterSetState(false);

        // indicate the editor state has changed (this action is not undoable)
        // TODO creating user hulls is not undoable now
        if (this.pushEvent !== undefined) {
            this.pushEvent(this.EVENT_CREATE_USER_HULL, {
                hull_id : hull_id
            });
        }
    },

    // Get an ID string for a new user hull. Avoids re-using any existing
    // ones.
    //
    _getNewUserHullId : function (seq_num) {
        "use strict";

        if (seq_num === undefined) {
            var user_hulls = this.getUserHulls();
            seq_num = user_hulls.length + 1;
        }

        var suffix  = "" + seq_num,
            hull_id = this.USER_HULL_ID_PREFIX + suffix;

        if (this.hulls[hull_id] !== undefined) {
            // if this id is already taken, try the next one in sequence
            return this._getNewUserHullId(seq_num + 1);
        }

        return hull_id;
    },

    createUserHullKeepLinks: function () {
        "use strict";

        return this.createUserHull(true);
    },

    // Tell if ALL selected nodes belong to a single user hull.
    // If they do, return the hull id; if they don't, return false.
    //
    selectedInUserHull : function () {
        "use strict";

        if (this.countSelected() === 0 || this.getUserHulls().length === 0) {
            return false;
        }

        var selected_ids = this.getSelectedIds(),
            entries      = d3.entries(this.hulls);

        selected_ids.sort();

        // jshint -W083
        for (var idx = 0; idx < entries.length; ++idx) {
            var entry       = entries[idx],
                hull_id     = entry.key,
                nodes       = entry.value,
                node_ids    = nodes.map(function(node) { return node.id; });

            node_ids.sort();

            if (node_ids.every(function(val, i) {return selected_ids[i] === val;})) {
                return hull_id;
            }
        }
        // jshint +W083

        return false;
    },

    _addNodeToUserHull : function (node, hull_id) {
        "use strict";

        if (this.hulls[hull_id] === undefined) {
            // hull doesn't exist, create it and mark it as user-created
            this._createHullNode(hull_id);
        }

        node.hull = hull_id;
        this.hulls[hull_id].push(node);
    },

    _createHullNode : function (hull_id) {
        "use strict";

        var node_data = {
            id       : hull_id,
            fake     : true,
            kind     : "hull",
            y_offset : 0,

            idx      : this.all_nodes.length
        };

        this.all_nodes.push(node_data);
        this.nodes_map[hull_id] = node_data;

        this.hulls[hull_id] = [];
    },

    // Make links for nodes in given hull invisible.
    // Currently, this sets them to "removed".
    //
    _processLinksInUserHull : function (hull_id, retain_links) {
        "use strict";

        var nodes_in_hull = this.hulls[hull_id];

        this.all_links.forEach(function (link) {
            var source_in_hull = nodes_in_hull.indexOf(link.source) !== -1,
                target_in_hull = nodes_in_hull.indexOf(link.target) !== -1;

            if (!retain_links && source_in_hull && target_in_hull) {
                // remove internal hull links
                link.removed = true;
            }
            else if (source_in_hull ^ target_in_hull) {
                // if a link is going to/outside the hull, set its length to
                // 0, so it gets recalculated on a first layout update.
                link.length = 0;
            }
        }, this);
    },

    //
    // COLLECTIONS
    // ===========

    createUserCollection : function () {
        "use strict";

        var selected            = this.getSelectedIds(),
            selected_nodes      = [],
            members             = [],
            member_kinds        = {},
            members_short_name  = [],

            // collections "merged" into the user collection
            merged_collections  = [],

            // collection ids / names start from suffix 1
            collection_id       = this._getNewUserCollectionId();

        this._populateMemberData(selected, members, member_kinds,
                                 members_short_name);

        var collection = this._createCollectionNode(
            collection_id, {
                members             : members,
                member_kinds        : member_kinds,
                members_short_name  : members_short_name
        });

        // update this.collection_members object
        members.forEach(function (member) {
            this.collection_members[member] = collection_id;
        }, this);

        // collect selected nodes in the newly created collection
        selected.forEach(function (node_id) {
            var node            = this.nodes_map[node_id],
                is_collection   = this.isCollectionNode(node);

            selected_nodes.push(node);

            if (is_collection && node.expandable) {
                node.hidden = true;

                // replaced means that this collection is no longer valid
                // for serialization, although it is not explicitly removed
                node.replaced = true;

                merged_collections.push(node);
            }
            else if (!is_collection) {
                node.collection = collection_id;
            }
        }, this);

        // pick x, y position for collection
        var middle_idx = Math.floor(selected_nodes.length / 2);

        collection.x = selected_nodes[middle_idx].x;
        collection.y = selected_nodes[middle_idx].y;

        this._processLinksInUserCollection(selected, collection_id);

        // process the new data - safe to call with all nodes and links,
        // as we have just modified them
        this._handleData(
            {
                nodes: this.nodes_map,
                links: this.all_links
            }
        );

        // re-use generic collapse function to hide nodes properly
        // (don't issue an undo event, we have a custom one)
        this.collapseCollection(collection, bindContext(this, function () {
            var objref = this;

            this.node_sel.each(function (n) {
                if (n.id === collection_id) {
                    objref.highlightNode(this, collection_id, true);
                }
            });
        }), false);

        if (this.pushEvent !== undefined) {
            // TODO creating user collection is not undoable now
            this.pushEvent(this.EVENT_CREATE_USER_COLLECTION, {
                collection         : collection,
                merged_collections : merged_collections
            });
        }
    },

    // Get an ID string for a new user collection. Avoids re-using any existing
    // ones.
    //
    _getNewUserCollectionId : function (seq_num) {
        "use strict";

        if (seq_num === undefined) {
            var user_cols = this.getUserCollections();
            seq_num = user_cols.length + 1;
        }

        var suffix = "" + seq_num,
            col_id = this.USER_COLLECTION_ID_PREFIX + suffix;

        if (this.nodes_map[col_id] !== undefined) {
            // if this id is already taken, try the next one in sequence
            return this._getNewUserCollectionId(seq_num + 1);
        }

        return col_id;
    },

    // Rename an existing user collection - high level user action.
    //
    renameUserCollectionAction : function (datum, target) {
        "use strict";

        // close the context menu
        autocloser.forceClose();

        // create (if needed) the rename modal and open it
        if (this.rename_collection_modal === undefined) {
            this.createRenameCollectionModal();
        }

        this.rename_collection_modal.open();

        // set the input value to current name
        var name_input = d3.select("input.dialogNameInput[name='collection_name']"),
            old_name   = datum.collection_name;

        name_input[0][0].value = old_name;

        // We have to bind this event here after the modal has been
        // displayed, due to the way Control.Modal manipulates the DOM.

        d3.select("#renameCollectionOKButton").on(
            "click", bindContext(this, function () {
                var col_name = name_input[0][0].value,
                    flash_board = d3.select("#modal_container .flashBoard");

                // require non-empty name
                if (/^\s*$/.match(col_name)) {
                    flash_board
                        .style("visibility", "true")
                        .text("Collection name is required");

                    return;
                }

                // perform the actual rename
                this.renameUserCollection(datum, col_name);

                Control.Modal.close();

                if (this.pushEvent !== undefined) {
                    this.pushEvent(this.EVENT_RENAME_USER_COLLECTION, {
                        collection : datum,
                        old_name   : old_name,
                        new_name   : col_name,

                        undo       : this._handleUndoRenameCollection,
                        redo       : this._handleRedoRenameCollection
                    });
                }
            })
        );
    },

    // Rename user collection - low level function.
    //
    renameUserCollection : function (collection, name) {
        "use strict";

        // set the name
        collection.short_name        = name;
        collection.name              = name;
        collection.collection_name   = name;

        // re-build all node labels
        this.buildLabels(false, function() {}, true);

        // update node titles (hover tooltips)
        this.nodes_group.selectAll("g").select("title").html(
            function (d) {
                return d.name;
            }
        );
    },

    createRenameCollectionModal : function () {
        "use strict";

        var top_element = this.top_div[0][0],
            modal_div = document.createElement("div");

        // Insert modal div right after top div
        top_element.parentNode.insertBefore(modal_div, top_element.nextSibling);

        modal_div = d3.select(modal_div);

        // Create contents of modal dialog

        modal_div.append("a")
            .attr("href", "#rename-dialog")
            .attr("id", "rename-dialog-link")
            .attr("style", "display:none");

        var content_div = modal_div.append("div")
            .attr("id", "rename-dialog")
            .attr("style", "display:none");

        content_div.append("p")
            .attr("class", "modal-header")
            .text("Rename collection");

        var table = content_div.append("table")
            .attr("class", "mainTable");

        var line = table.append("tr");

        line.append("td")
            .attr("class", "dataLabel")
            .attr("style", "vertical-align: middle")
            .append("label")
            .attr("for", "collection_name")
            .html('<span class="required">*</span>Name');

        var td = line.append("td")
            .attr("class", "dataField")
            .attr("style", "vertical-align: middle");

        td.append("input")
            .attr("class", "dialogNameInput")
            .attr("name", "collection_name")
            .attr("style", "width:90%");
        td.append("div")
            .attr("class", "flashBoard flashFailureMsg");

        var buttons = content_div.append("p")
            .attr("class", "modal-footer");

        buttons.append("button")
            .attr("class", "button primary")
            .attr("id", "renameCollectionOKButton")
            .text("OK");

        // Strange way to have spacing between buttons
        buttons.append("span").html("\n&nbsp;\n");

        // Need to specifically define an onclick attribute
        // here to make the button work correctly.
        buttons.append("button")
            .attr("class", "button secondary")
            .text("Cancel")
            .attr("onclick", "Control.Modal.close()");

        this.rename_collection_modal = new Control.Modal(
            $('rename-dialog-link'),
            {
                opacity: 0.65,
                overlayCloseOnClick: false,
                containerClassName: 'rename-dialog'
            });
    },

    // Undo / redo handlers for collection renaming
    //
    _handleUndoRenameCollection : function (data) {
        "use strict";

        this.renameUserCollection(data.collection, data.old_name);

        return true;
    },

    _handleRedoRenameCollection : function (data) {
        "use strict";

        this.renameUserCollection(data.collection, data.new_name);

        return true;
    },

    // Populate collection members data
    // Mutates members, member_kinds and members_short_name
    //
    _populateMemberData : function (selected, members, member_kinds,
                                    members_short_name) {
        "use strict";

        var bump_kind = function(kind, amount) {
            if (amount === undefined) {
                amount = 1;
            }

            if (member_kinds[kind] === undefined) {
                member_kinds[kind] = amount;
            }
            else {
                member_kinds[kind] += amount;
            }
        };

        selected.forEach(function (node_id) {
            var node            = this.nodes_map[node_id],
                is_collection   = this.isCollectionNode(node);

            if (is_collection && node.expandable) {
                // execute members.push(node.members[0], node.members[1], ...)
                Array.prototype.push.apply(members, node.members);

                Array.prototype.push.apply(
                    members_short_name, node.members_short_name
                );

                d3.entries(node.member_kinds).forEach(function(entry) {
                    var kind = entry.key,
                        val  = entry.value;

                    bump_kind(kind, val);
                });

                node.removed = true;
            }
            else if (!is_collection) {
                members.push(node_id);
                members_short_name.push(node.short_name);

                bump_kind(node.kind);
            }
        }, this);
    },

    // Create a new blank collection node, with optional attributes copied
    // from "attrs" Object argument.
    //
    _createCollectionNode : function (collection_id, attrs) {
        "use strict";

        var col_node = {
            id                  : collection_id,
            members             : [],
            member_kinds        : {},
            members_short_name  : [],

            expandable          : true,
            expanded            : false,
            collection_name     : collection_id,
            collection_type     : this.COLLECTION_TYPE_USER,
            collection          : collection_id,

            name                : collection_id,
            short_name          : collection_id,
            root                : false,

            removed             : false,
            hull                : null,

            kind                : this.COLLECTION_KIND_USER,

            // loaded flag is only used by this mixin, and only
            // for user collections
            loaded              : false
        };

        col_node = mergeObjects(col_node, attrs);

        this.all_nodes.push(col_node);
        this.nodes_map[collection_id] = col_node;

        return col_node;
    },

    _processLinksInUserCollection : function(selected, collection_id) {
        "use strict";

        // TODO BUG sometimes re-links wrongly for non-expandable collections
        // to reproduce: create a new user collection out of non-exp collection
        // and ordinary nodes

        // TODO BUG will copy links from removed nodes

        var collection  = this.nodes_map[collection_id],
            new_links   = [];

        this.all_links.forEach(function(link) {
            var outgoing = (
                    selected.indexOf(link.src_id) !== -1 &&
                    selected.indexOf(link.tgt_id) === -1
                ),
                incoming = (
                    selected.indexOf(link.tgt_id) !== -1 &&
                    selected.indexOf(link.src_id) === -1
                );

            // copy all links that are incoming or outgoing for collection
            // members (but not both - XOR, ie. skip internal links)
            if (outgoing ^ incoming) {
                var new_link = {
                    kind    : link.kind,
                    style   : link.style,
                    removed : false,

                    src_id  : outgoing ? collection_id : link.src_id,
                    source  : outgoing ? collection : link.source,

                    tgt_id  : incoming ? collection_id : link.tgt_id,
                    target  : incoming ? collection : link.target,

                    id      : link.id + "_" + collection_id,
                    rel_id  : undefined
                };

                new_links.push(new_link);
                this.links_map[new_link.id] = new_link;
            }
        }, this);

        this.all_links = this.all_links.concat(new_links);
    },

    // User collection specific expanding.
    //
    expandUserCollection : function (collection, callback) {
        "use strict";

        this._ensureCollectionMembersLoaded(collection, bindContext(this, function () {
            var data = {
                nodes   : this.nodes_map,
                links   : this.all_links
            };

            collection.members.forEach(function (member_id) {
                this.nodes_map[member_id].hidden = false;
            }, this);

            collection.expanded = true;

            this._handleData(data, collection,
                this.finishExpandCollection.bind(this, data, collection, callback));
        }));
    },

    // User collection specific loading of members for collection previews.
    //
    loadUserCollectionMembers : function (collection, callback) {
        "use strict";

        this._ensureCollectionMembersLoaded(collection, bindContext(this, function () {
            var internal_links = this.all_links.filter(function (link) {
                return (
                    collection.members.indexOf(link.src_id) !== -1 &&
                    collection.members.indexOf(link.tgt_id) !== -1
                );
            });

            var member_lookup   = this._getMemberLookup(collection.members),
                data            = {
                    nodes : member_lookup,
                    links : internal_links
                };

            if (callback) {
                callback(collection, data);
            }
        }));
    },

    // Expand all visible (non-removed), non-expanded, expandable collections.
    //
    _expandAllCollectionsAction : function () {
        "use strict";

        this.all_nodes.forEach(function (node) {
            if (this.isCollectionNode(node) && node.expandable &&
                    !(node.hidden || node.removed)) {

                // hide the nodes to be expanded on next transition
                node.hidden = true;

                this.expandCollection(node, bindContext(this, function () {
                    // this won't get called for every collection
                    // this is because of a bug in layoutTransition, which
                    // won't call callbacks in some situations
                    this.zoomToFit();
                }));
            }
        }, this);
    },

    // Ensure that all the collection members' data has been loaded from
    // the backend. This might or might not do any requests. It won't expand
    // any collections, it will just add missing nodes data for collapsed
    // members.
    //
    // The callback function takes no parameters and gets executed after
    // the data has finished loading, or it's been determined that it's
    // already been loaded.
    //
    _ensureCollectionMembersLoaded: function (collection, callback) {
        "use strict";

        // loaded flag is only used by this mixin, and only for user collections
        if (collection.loaded) {
            return callback ? callback() : undefined;
        }

        // only load non-removed members
        var to_load = collection.members.filter(function (member_id) {
            var member_node = this.nodes_map[member_id];

            if (member_node && member_node.removed) {
                return false;
            }

            return true;
        }, this);

        // load the data, creating node entries and adding relevant links,
        // but don't change existing collections
        tw.xhr_client.jsonPostForm(
            this.options.expand_collection_api_url,
            {
                adding_node_ids : Object.toJSON(to_load),
                grouping_params : this.options.grouping_params
            },
            bindContext(this, function (error, api_data) {
                if (error) {
                    return;
                }

                var data = {
                    links: api_data.links,
                    nodes: {}
                };

                d3.entries(api_data.nodes).forEach(function (entry) {
                    var node_id = entry.key,
                        node    = entry.value;

                    if (to_load.indexOf(node_id) !== -1) {
                        // disregard API collection data - we know these are
                        // collapsed collection members
                        node.collection = collection.id;
                        node.hidden     = true;

                        data.nodes[node_id] = node;
                    }
                });

                collection.loaded = true;

                this._handleData(data, undefined, callback);
        }));
    }
});


/* global d3, TWClass */
/* jshint sub: true, nonew: false, scripturl: true */

// Generic 'application busy' indicator comprised of a spinning animated gif

if (tw === undefined) {
    var tw = {};
}

if (tw.viz === undefined) {
    tw.viz = {};
}

tw.viz.SpinnerMixin = TWClass.create({

    _spinner : undefined,

    _getSpinner : function() {
        "use strict";

        if (this._spinner === undefined) {
            // We can't rely on any particular element being present except for the body, so
            // we put the spinner as a child of the body element.
            this._spinner = d3.select("body").append("div")
                .append("img")
                .classed("inline-visualization-loading-icon", true)
                .attr("src", this.options.images.loading_icon);
        }

        return this._spinner;
    },

    showSpinner : function() {
        "use strict";

        this._getSpinner().style("display", null);
    },

    hideSpinner : function() {
        "use strict";

        this._getSpinner().style("display", "none");
    }
});

/* global d3, bindContext, TWClass */
/* jshint sub: true, nonew: false, scripturl: true */

if (tw === undefined) {
    var tw = {};
}
if (tw.viz === undefined) {
    tw.viz = {};
}

// Mixin for undo
//
tw.viz.UndoMixIn = TWClass.create({

    EVENT_HANDLER_COLLECT_FOR_UNDO : "collect_for_undo_handler",

    undo_stack         : undefined,
    undo_stack_pointer : 0,

    // Event handler name for updating Undo/Redo buttons
    event_handler_update_icons : "update_undo_redo_icons",

    // Construct Undo and Redo button inside visualization control bar.
    //
    // Note: Construct and insert Redo button as first element under ctrl_div before
    // the Undo so that the latter is shown before the former in UI.
    //
    _constructUndoRedoButtons : function () {
        "use strict";

        // Register event subscriber so that whenever there is an item in undo/redo stack,
        // the respective button is updated for clear visual indication.
        if (this.subscribeEventHandler !== undefined) {
            this.subscribeEventHandler(
                this.event_handler_update_icons,
                [ "*" ],
                bindContext(this, function (event_name, data) {
                    this._updateUndoRedoButtons();
                })
            );
        }

        // Redo button
        /*this.ctrl_div
            .insert("img", ":first-child")
            .attr("class", "ControlDivRedo")
            .style({
                "vertical-align": "top",
                padding: "10px 0px 4px 6px",
                display: "inline"
            })
            .on("click", bindContext(this, function () {
                if (this.canRedo()) {
                    this.redo();
                    this._updateUndoRedoButtons(undefined, this.options.images.icon_redo_hover);
                }
            }))
            .attr("src", this.options.images.icon_redo_dis)
            .on("mouseout", bindContext(this, this._updateUndoRedoButtons))
            .on("mouseover", bindContext(this,
                this._updateUndoRedoButtons, undefined, this.options.images.icon_redo_hover));

        // Undo button
        this.ctrl_div
            .insert("img", ":first-child")
            .attr("class", "ControlDivUndo")
            .style({
                "vertical-align": "top",
                padding: "10px 0px 4px 6px",
                display: "inline"
            })
            .on("click", bindContext(this, function () {
                if (this.canUndo()) {
                    this.undo();
                    this._updateUndoRedoButtons(this.options.images.icon_undo_hover);
                }
            }))
            .attr("src", this.options.images.icon_undo_dis)
            .on("mouseout", bindContext(this, this._updateUndoRedoButtons))
            .on("mouseover", bindContext(this,
                this._updateUndoRedoButtons, this.options.images.icon_undo_hover));*/
    },

    initUndo : function () {
        "use strict";

        this.undo_stack = [];

        d3.select("body").on("keydown.undo", bindContext(this, function () {
            var e = d3.event;

            if ((e.ctrlKey && e.keyCode === 89) ||
                (e.metaKey && e.keyCode === 89) ||
                (e.metaKey && e.shiftKey && e.keyCode === 90)) {
                // ctrl+y redo / meta+y / meta+shift+z
                if (this.canRedo()) {
                    this.redo();
                }
            }
            else if ((e.ctrlKey && e.keyCode === 90) ||
                     (e.metaKey && e.keyCode === 90)) {
                // ctrl+z undo / meta+z
                if (this.canUndo()) {
                    this.undo();
                }
            }
        }));

        // Add event collection handler

        if (this.subscribeEventHandler !== undefined) {
            this.subscribeEventHandler(
                this.EVENT_HANDLER_COLLECT_FOR_UNDO,
                [ "*" ],
                this._processEventForUndo
            );
        } else {
            console.log("Internal Error: trying to register undo mixin " +
                        "without event pump mixin");
        }
    },

    addUndoContextMenuItems : function () {
        "use strict";

        this.CONTEXT_MENU_ITEMS["background"] =
            this.CONTEXT_MENU_ITEMS["background"].concat([
                null,
                [
                    bindContext(this, this.getUndoOperationLabel),
                    bindContext(this, this.canUndo),
                    bindContext(this, this.undo)
                ],
                [
                     bindContext(this, this.getRedoOperationLabel),
                    bindContext(this, this.canRedo),
                    bindContext(this, this.redo)
                ]
            ]);
    },

    _processEventForUndo : function (event_name, data) {
        "use strict";

        // Make sure all required data properties are there

        if (data.undone === undefined ||
            data.undo === undefined ||
            data.redo === undefined) {

                return;
            }

        // Discard all possible redo events

        this.undo_stack.splice(this.undo_stack_pointer,
                               this.undo_stack.length - this.undo_stack_pointer);

        // Push event to the undo stack

        data.event = event_name;
        this.undo_stack.push(data);
        this.undo_stack_pointer++;
    },

    // Return true if the user can undo an action.
    //
    canUndo : function () {
        "use strict";

        return this.undo_stack_pointer > 0;
    },

    // Return the pending undo operation data.
    //
    getUndoOperation : function () {
        "use strict";

        if (!this.canUndo()) {
            return;
        }
        return this.undo_stack[this.undo_stack_pointer-1];
    },

    // Return the descriptive label for pending undo operation.
    //
    getUndoOperationLabel : function () {
        "use strict";

        var op   = this.getUndoOperation(),
            name = "";

        if (op && op.undo_name) {
            if (typeof op.undo_name === "function") {
                name = op.undo_name(op);
            }
            else {
                name = op.undo_name;
            }
        }
        else if (op) {
            name = op.event;
        }

        return name === "" ? name : "Undo " + name;
    },

    // Undo the last action.
    //
    undo : function () {
        "use strict";

        var data = this.getUndoOperation();

        if (data !== undefined) {

            // Do the undo

            if (!bindContext(this, data.undo)(data)) {
                return false;
            }
            data.undone = true;

            // Decrease the undo pointer

            this.undo_stack_pointer-=1;

            if (this.pushEvent !== undefined) {
                this.pushEvent(this.EVENT_UNDO, {
                    related_event : data.event
                });
            }
			var selectionCount = this.countSelected();
            if(selectionCount != 1){
                enableAnalyzeImpactButton(false);
            }else{
                updateDetailHeader();
                enableAnalyzeImpactButton(true);
            }
            enableLinkMenuItem(selectionCount);

            return true;
        }

        return false;
    },

    // Return true if the user can redo an action.
    //
    canRedo : function () {
        "use strict";

        return this.undo_stack_pointer < this.undo_stack.length;
    },

    // Return the pending redo operation data.
    //
    getRedoOperation : function () {
        "use strict";

        if (!this.canRedo()) {
            return;
        }
        return this.undo_stack[this.undo_stack_pointer];
    },

    // Return the descriptive label for pending redo operation.
    //
    getRedoOperationLabel : function () {
        "use strict";

        var op   = this.getRedoOperation(),
            name = "";

        if (op && op.redo_name) {
            if (typeof op.redo_name === "function") {
                name = op.redo_name(op);
            }
            else {
                name = op.redo_name;
            }
        }
        else if (op) {
            name = op.event;
        }

        return name === "" ? name : "Redo " + name;
    },

    // Redo the last undone action.
    //
    redo : function () {
        "use strict";

        var data = this.getRedoOperation();

        if (data !== undefined) {

            // Do the redo

            if (!bindContext(this, data.redo)(data)) {
                return false;
            }
            data.undone = false;

            // Increase the undo pointer

            this.undo_stack_pointer += 1;

            if (this.pushEvent !== undefined) {
                this.pushEvent(this.EVENT_REDO, {
                    related_event : data.event
                });
            }
			var selectionCount = this.countSelected();
            if(selectionCount != 1){
                enableAnalyzeImpactButton(false);
            }else{
                updateDetailHeader();
                enableAnalyzeImpactButton(true);
            }
            enableLinkMenuItem(selectionCount);
            return true;
        }

        return false;
    },

    // Update icons for Undo/Redo buttons.
    //
    // undo_enabled_icon - (Optional) Icon to be used when the Undo operation is possible,
    // redo_enabled_icon - (Optional) Icon to be used when the Redo operation is possible.
    //
    _updateUndoRedoButtons : function (undo_enabled_icon, redo_enabled_icon) {
        "use strict";

        undo_enabled_icon = undo_enabled_icon || this.options.images.icon_undo_normal;
        redo_enabled_icon = redo_enabled_icon || this.options.images.icon_redo_normal;

        // Depending on whether undo/redo operation is possible or not,
        // alter title and icon image

        // For undo button
        var undo_button = this.ctrl_div.select("img.ControlDivUndo"),
            redo_button = this.ctrl_div.select("img.ControlDivRedo");

        if (!this.canUndo()) {
            undo_button
                .attr("title", "Cannot Undo")
                .attr("alt", "Cannot Undo")
                .attr("src", this.options.images.icon_undo_dis);
        }
        else {
            var undo_label = this.getUndoOperationLabel();

            undo_button
                .attr("title", undo_label)
                .attr("alt", undo_label)
                .attr("src", undo_enabled_icon);
        }

        // For redo button
        if (!this.canRedo()) {
            redo_button
                .attr("title", "Cannot Redo")
                .attr("alt", "Cannot Redo")
                .attr("src", this.options.images.icon_redo_dis);
        }
        else {
            var redo_label = this.getRedoOperationLabel();

            redo_button
                .attr("title", redo_label)
                .attr("alt", redo_label)
                .attr("src", redo_enabled_icon);
        }
    },

    eraseUndoRedoStack: function() {
        "use strict";

        this.undo_stack = [];
        this.undo_stack_pointer = 0;
        this._updateUndoRedoButtons();
    }
});


/* global d3, autocloser, bindContext, TWClass, $ */
/* jshint sub: true, nonew: false, scripturl: true */

// Inline visualization

if (tw === undefined) {
    var tw = {};
}
if (tw.viz === undefined) {
    tw.viz = {};
}

// Mixin for sidebar menu component.
//
// Each item in this.SIDE_BAR_MENU_ITEMS is a tuple (list) of 4 or 5 items:
//  show expand menu (bool)
//  icon path
//  menu label
//  function to construct the expand element
//  options (optional)
//
// or a function which returns a list of such tuples (may return an empty
// list). This function has no argumnts.
//
tw.viz.SidebarMixIn = TWClass.create({

    // DOM objects

    side_bar_menu             : undefined, // Div which holds the side bar menu
    side_bar_menu_expand      : undefined, // Div which holds the extended
                                           // side bar menu
    side_bar_menu_open_func   : undefined, // Functions which can be used to open
                                           // the sidebar
    side_bar_menu_open_link   : undefined, // Link elements of the sidebar
    side_bar_menu_highlights  : {},        // "Menu label": true if highlighted

    update_side_bar_listeners : [],

    side_bar_open_menu_label  : undefined, // Label of a link which is currently open

    side_bar_active_tabs      : {},        // Side bar element label : index of an
                                           // active tab

    selected_side_bar_removed_nodes_sort_type: "", // {string} sort type of removed nodes in
    // removed nodes sidebar tab, can be "removed_seq" or "kind"


    initSideBar : function () {
        "use strict";

        this.removeSideBarMenuHighlightDelayed = debounce(
            this.removeSideBarMenuHighlight,
            this.options.side_bar_highlight_timeout
        );
    },

    // Update the sidebar menu. This function should be called whenever
    // the sidebar should change. It is called with every click on a
    // sidebar item.
    //
    updateSideBarMenu : function () {
        "use strict";

        if (this.enabled === false) {
            // Visualization isn't enabled, nothing to update.
            return;
        }

        // Check for initialisation

        if (this.side_bar_menu === undefined) {
            this.side_bar_menu = this.in_div.append("div")
                .attr("class", "visSideBar");

            this.side_bar_menu_expand = this.in_div.append("div")
                .attr("id", "viz-sidebar-menu-expand")
                .attr("class", "menuExpand")
                .style("display", "none");
        }

        this.side_bar_menu.html("");

        // If the sidebar was closed by autocloser, the value of this.side_bar_open_menu_label
        // is left unchanged. (as autocloser manipulates classes and styles on DOM elements)
        // To avoid toggleSidebar function think that sidebar is open, we need to manually set it to
        // undefined if sidebar menu is closed.
        if (!this.isSideBarMenuVisible()) {
            this.side_bar_open_menu_label = undefined;
        }

        this.side_bar_menu_open_func = {};
        this.side_bar_menu_open_link = {};

        this.SIDE_BAR_MENU_ITEMS.forEach(function (item, i) {

            var link_id = "viz-sidebar-menu-link-" + i,
                tuple,
                label,
                highlighted,
                link_is_open,
                options;

            if (typeof item === "function") {
                tuple = item();
            }
            else {
                tuple = item;
            }

            // Do not show menu if the menu type is not defined

            if (tuple[0] === undefined) {
                return;
            }

            label        = tuple[2];
            highlighted  = this.isSideBarMenuHighlighted(label);
            link_is_open = label === this.side_bar_open_menu_label;

            // Get options

            options = tuple.length === 5 ? tuple[4] : tuple[4] = {};

            if (options.disabled === undefined) {
                options.disabled = false;
            }
            if (options.tooltip === undefined) {
                if (tuple[0] === true) {
                    options.tooltip = "Show the " + label + " menu";
                    options.alt = "Icon indicating an openable " + label + " menu";
                }
                else {
                    options.tooltip = label;
                    options.alt = "Icon indicating an openable menu";
                }
            }
            if (options.alt === undefined) {
                options.alt = "Icon indicating current mode";           
            } 
            if (options.highlight_img) {
                // Make sure the highlight image is preloaded, so it doesn't
                // blink weirdly when changing
                var preload_highlight_img = new Image();
                preload_highlight_img.src = options.highlight_img;
            }

            var link = this.side_bar_menu
                .append("div")
                .attr('class', 'menuItemDiv')
                .append("a")
                .attr("id", link_id)
                .attr("class", link_is_open ? "menuItem opened" : "menuItem closed")
                .attr("title", options.tooltip);

            if (tuple[0] === true) {
                link.classed("extend-link", true);
            }
            if (options.disabled) {
                link.classed("disabled", true);
            }

            var img = (highlighted && options.highlight_img) ? options.highlight_img
                                                             : tuple[1];

            link.append("img")
                .attr("src", img)
                .attr("alt", options.alt)
				.attr("class", options.className);
            link.append("div")
                .text(label || "");
			link.append("img")
				.attr("src", tw.viz.DEFAULT_IMAGES.sidebar_arrow_logo)
				.attr("class", "arrow-icon")
				.style("display", "none");

            this._drawBadge(link, options.badge);

            if (options.highlight_class) {
                link.classed(options.highlight_class, highlighted);
            }

            link.on("click", bindContext(this, this.toggleSideBarMenu, tuple, link_id));

            this.side_bar_menu_open_link[label] = link;
            this.side_bar_menu_open_func[label] = bindContext(this, function () {
                // Need to call autocloser after the current click event has been handled.
                window.setTimeout(bindContext(this, this.toggleSideBarMenu, tuple, link_id), 0);
            });

            // If sidebar is being updated while some link is open
            // reset autocloser.parentItem as it is no longer valid
            // (old link is replaced by new one)
            //
            if (link_is_open) {
                autocloser.parentItem = $(link_id);
            }
        }, this);

        this.update_side_bar_listeners.forEach(function (item) {
            item();
        }, this);
    },

    // Function that renders a badge/badges in sidebar item
    // sidebar_item {D3 Selection} - Element fro sidebar item
    // badge {string, or object, or array of objects} - badge details
    //
    _drawBadge: function(sidebar_item, badge) {
        "use strict";

        if (badge) {
            var badges = Array.isArray(badge) ? badge : [badge],
                non_zero_badges = [];

            badges.forEach(function(badge_item) {
                if (typeof badge_item === "object") {
                    if (badge_item.amount) {
                        non_zero_badges.push(badge_item);
                    }
                }
                else if (badge_item) {
                    non_zero_badges.push({
                        title : "",
                        amount: badge_item
                    });
                }
            });

            non_zero_badges.forEach(function(badge_item) {
                var badge_element,
                    badge_class_names = {
                        badge: true
                    };

                if (badge_item.title) {
                    badge_class_names["badge_" + badge_item.title.toLowerCase()] = true;
                }

                badge_element = sidebar_item.append("div")
                    .classed(badge_class_names);

                badge_element.append("span")
                    .classed("badge__title", true)
                    .text(badge_item.title ? badge_item.title + ": " : "");

                badge_element.append("span")
                    .classed("badge__amount", true)
                    .text(badge_item.amount);
            }, this);
        }
    },

    // Check if sidebar menu DOM element is visible
    //
    isSideBarMenuVisible: function() {
        "use strict";

        // return this.side_bar_menu_expand.style("display") !== "none";
		return	true;
    },

    // Open / close the extended side bar menu. This function is called with every
    // click on a sidebar item.
    //
    toggleSideBarMenu : function (tuple, link_id) {
        "use strict";

        // Turn the node picker off in case of click on any sidebar item.
        if (this.isNodePickerOn && this.isNodePickerOn()) {
            this.turnNodePickerOff();
        }

        // Check if the menu item is already open

        var opened_menu_clicked = d3.select("#" + link_id).classed("opened");

        // Close side panel if it is open

        this.closeSideBarExtendPanel();
        this.side_bar_open_menu_label = undefined;

        // Do not show side panel if the open menu item was clicked OR in case
        // the clicked menu item is disabled.
        if (opened_menu_clicked || tuple[4].disabled === true) {
            return;
        }

        // Set the side_bar_open_menu_label if the menu item is expandable

        if (tuple[0] === true) {
            this.side_bar_open_menu_label = tuple[2];
        }

        // Remove old content from the expand menu

        this.side_bar_menu_expand.html("");

        var args = [ this.side_bar_menu_expand ].concat(
            Array.prototype.slice.call(arguments, 0));

        tuple[3].apply(this, args);

        // Show expand menu if the menu item is expandable

        if (tuple[0] === true) {
            autocloser.toggleHolder(link_id, 'viz-sidebar-menu-expand');
            this.focusFirstSideBarTextInput();
            return;
        }

        this.updateSideBarMenu();
    },

    // Close the extend panel of the sidebar if it is open.
    //
    closeSideBarExtendPanel : function () {
        "use strict";

        if (this.side_bar_menu_expand && this.side_bar_menu_expand.style("display") !== "none") {
            autocloser.close(autocloser.activeElement);
        }

        // Make sure all sidebar menu items have the closed state

        this.side_bar_menu.selectAll(".menuItem").classed("opened", false);
        this.side_bar_menu.selectAll(".menuItem").classed("closed", true);
    },

    // Helper function to create a sidebar button.
    //
    // sidebar_div         - Div which represents the sidebar.
    // icon                - Icon for the button.
    // label               - Label for the button.
    // handler             - Handler which should be called when the button is clicked.
    // classes             - optional: Additional classes which should be put onto the button.
    // disabled_message    - optional: Flag/Message to disable the button/Show tooltip message with disabling reason.
    //
    createSideBarButton : function (sidebar_div, icon, label, handler, classes, disable_message) {
        "use strict";

        var option;

        classes = "vis-sidebar-menu-list-item vis-sidebar-menu-action " + (classes !== undefined ? classes : "");

        if (disable_message === undefined) {
            option = sidebar_div.append("button")
                .attr("type", "button")
                .on("click", handler);
        }
        else {
            option = sidebar_div.append("a");
            option.attr("title", disable_message || "");
            classes += " disabled";
        }

        option.attr("class", classes);

        option.append("img")
            .attr("src", icon)
            .attr("role", "menuitem")
            .attr("alt", "icon depicting " + label + " focus");

        option.append("div").text(label);
    },

    // Helper function to create a sidebar section divider.
    //
    // sidebar_div - Div which represents the sidebar.
    //
    createSideBarSection : function (sidebar_div, label) {
        "use strict";

        sidebar_div.append("div")
            .attr("class", "vis-sidebar-menu-section")
            .text(label);
    },

    // Helper function to create sidebar tabs.
    //
    // sidebar_div - Div which represents the sidebar.
    // labels      - Object which represents the content.
    //                   keys    : Tab headers.
    //                   values  : Function which construct the tab body.
    //
    // Returns the list of div elements from the tab header.
    //
    createSideBarTabs : function (sidebar_div, tabs) {
        "use strict";

        var tab_header = sidebar_div.append("div")
                .attr("class", "vis-sidebar-tab-header"),
            tab_body = sidebar_div.append("div")
                .attr("class", "vis-sidebar-tab-body"),
            tab_divs = [],
            deactivate_tab_divs = function () {
                tab_divs.forEach(function (tab) {
                    tab.classed("inactive", true);
                    tab.classed("active", false);
                });
            },
            item_label = this.side_bar_open_menu_label,
            objref = this;

        // Set the active tab if it isn't set yet

        if (this.side_bar_active_tabs[item_label] === undefined) {
            this.side_bar_active_tabs[item_label] = 0;
        }

        tabs.forEach(function (tab, i) {
            var tab_element = tab_header.append("div")
                .attr("class", i === this.side_bar_active_tabs[item_label] ?
                    "active" : "inactive")
                .html(tab.label);

            tab_divs.push(tab_element);

            // Add click listeners so we can change the tabs

            tab_element.on("click", function () {

                deactivate_tab_divs();
                tab_element.classed("inactive", false);
                tab_element.classed("active", true);

                tab_body.html("");

                tab.build_tab_body(tab_body);

                // Remember tab as active when it's clicked

                objref.side_bar_active_tabs[item_label] = i;
            });

            // Show the active tab

            if (i === this.side_bar_active_tabs[item_label]) {
                tab.build_tab_body(tab_body);
            }
        }, this);

        return tab_divs;
    },

    // Helper function to create a button in a tab.
    //
    // tab_body_div - Div which represents the tab body.
    // label        - Label for the button.
    // title        - Title of the button.
    // handler      - Handler which should be called when the button is clicked.
    // disabled     - Flag to disable the button.
    //
    createSideBarTabButton : function (tab_body_div, label, title, handler, disabled) {
        "use strict";

        var option;

        if (disabled) {
            option = tab_body_div.append("a")
                .attr("title", title);
        }
        else {
            option = tab_body_div.append("button")
                .attr("type", "button")
                .attr("title", title)
                .on("click", handler);
        }

        option.attr("class", "vis-sidebar-menu-list-item vis-sidebar-menu-action");

        option.append("div").html(label);

        return option;
    },

    // Helper function to give focus to first text input within expanded sidebar menu
    //
    focusFirstSideBarTextInput : function () {
        "use strict";

        var text_input = this.side_bar_menu_expand
            .select("input[type=text]")
            .node();

        if (text_input !== null) {
            text_input.focus();
        }
    },

    // Tell if a side bar menu entry (identified by its label) is highlighted.
    //
    isSideBarMenuHighlighted : function (label) {
        "use strict";

        return this.side_bar_menu_highlights[label] === true;
    },

    // Remove the side bar menu highlight, immediately.
    //
    // The init function for this mixin adds a debounced version of this,
    // removeSideBarMenuHighlightDelayed.
    //
    removeSideBarMenuHighlight : function (label) {
        "use strict";

        if (this.isSideBarMenuHighlighted(label)) {
            delete this.side_bar_menu_highlights[label];
            this.updateSideBarMenu();
        }
    },

    // Highlight the sidebar menu entry identified by label.
    //
    // This does not update the sidebar, changes will be delayed until next
    // update (updateSideBarMenu).
    //
    highlightSideBarMenu : function (label) {
        "use strict";

        this.side_bar_menu_highlights[label] = true;
    },

    // Make the side bar tab (identified by menu item label and tab index) active.
    //
    // item_label  - label of the side bar menu entry which holds the tab.
    // tab_index   - index of the tab.
    // should_open - flag to indicate if the side bar should be opened.
    //
    activateSideBarTab : function (item_label, tab_index, should_open) {
        "use strict";

        // Check if the side bar tab is closed at the moment.
        var is_closed = item_label !== this.side_bar_open_menu_label ||
                        tab_index  !== this.side_bar_active_tabs[item_label];

        this.side_bar_active_tabs[item_label] = tab_index;

        // Open the side bar tab only if it is closed AND should be opened.
        if (should_open && is_closed) {
            this.side_bar_menu_open_func[item_label]();
        }
    },

    // Render a collapsible group element into the sidebar menu
    // options - Object of options for the side bar
    // options.container      {D3 Wrapper over DOM Element} to append group element to
    // options.group_class    {String}  - additional class name to all to a group element
    // options.collapsed      {Boolean} - flag indicating if group should be rendered collapsed
    // options.expandable     {Boolean} - flag indicating if it should be possible to
    // expand/collapse
    // options.group_name     {String}  - title of a group
    // options.group_sub_name {String}  - description of group
    // options.group_actions  {Function}- that accepts Group Action DOM element, this function
    // should render specific buttons into group action
    createSideBarMenuGroup: function(options) {
        "use strict";

        var container             = options.container,
            group_class           = options.group_class,
            collapsed             = options.collapsed,
            expandable            = options.expandable,
            group_name            = options.group_name,
            group_sub_name        = options.group_sub_name,
            render_group_actions  = options.group_actions,
            group, group_header, group_actions, group_title, group_body;

        group = container.append("div")
            .attr("class", group_class)
            .classed({
                "vis-sidebar-menu-group"          : true,
                "vis-sidebar-menu-group_collapsed": collapsed
            });

        group_header = group.append("div")
            .classed({
                "vis-sidebar-menu-list-item"    : true,
                "vis-sidebar-menu-group__header": true
            });

        if (expandable) {
            group_header.append("div")
                .classed({ "vis-sidebar-menu-group__icon": true })
                .on("click", function() {
                    d3.event.stopPropagation();
                    group.classed({
                        "vis-sidebar-menu-group_collapsed": !group.classed("vis-sidebar-menu-group_collapsed") // eslint-disable-line max-len
                    });
                });
        }

        if (render_group_actions) {
            group_actions = group_header.append("div")
                .classed({ "vis-sidebar-menu-group__actions": true });

            render_group_actions(group_actions);
        }

        group_title = group_header.append("div")
            .classed({ "vis-sidebar-menu-group__name": true });

        group_title.append("div")
            .classed({ "nowrap-line": true })
            .text(group_name);

        group_title.append("div")
            .classed({ "vis-sidebar-menu-group__sub-name": true, "nowrap-line": true })
            .text(group_sub_name);

        group_body = group.append("div")
            .classed({ "vis-sidebar-menu-group__body": true });

        return {
            group: group,
            body : group_body
        };
    }
});


/* global d3, Draggable, copyObject, isElementInViewport, bindContext, TWClass,
   $$, Chosen */
/* jshint sub: true, nonew: false, scripturl: true */

// Inline visualization

if (tw === undefined) {
    var tw = {};
}
if (tw.viz === undefined) {
    tw.viz = {};
}


// Common functionalities for CSI-to-SI conversion and CSI exclusion MixIns.
//
tw.viz.CSIManagement = TWClass.create({

    csi_ajax_url          : "AjaxCandidateToSoftwareGeneration", // Backend URL for CSI-related requests
    csi_kind              : "CandidateSoftwareInstance",         // Node Kind
    esc_event_name        : "keydown.csi_management_esc_key",    // Event name used for registering ESC key handler

    csi_in_progress       : false,     // Indicate if the CSI-related modal dialog is currently visible by user
    csi_target_node       : undefined, // CSI node on which user right-clicks on to get the modal dialog
    csi_nonce_token       : undefined, // Used for validating requests to the backend

    // Constructs the modal dialog's outter container. Contents of the dialog will be populated when it is
    // shown to user.
    // 
    // dialog_id   - Unique id for the dialog,
    // title       - Title of the dialog,
    // cancel_func - Function to call when "exit" button of the dialog is clicked.
    //
    _constructModalDialog : function (dialog_id, title, cancel_func) {
        "use strict";

        // Main container
        var modal_window = this.top_div.append("div")
            .attr("id", dialog_id)
            .attr("class", "InlineVisualizationKey")
            .style("display", "none");

        // Header

        var header_div = modal_window.append("div")
            .attr("class", "InlineVisualizationHeader")
            .attr("id", dialog_id + "csi_header");

        header_div.append("span").text(title);

        header_div.append("div")
            .attr("class", "InlineVisualizationHeaderButtons")
            .style("position", "absolute")
            .style("top", "0px")
            .style("right", "5px")
            .append("a")
            .attr("class", "header_exit_button")
            .attr("href", "javascript:void(0)")
            .attr("title", "Close Button")
            .append("img")
            .attr("alt", "X to close")
            .attr("src", tw.viz.DEFAULT_IMAGES.x_normal)
            .on("mouseover", function() { this.src=tw.viz.DEFAULT_IMAGES.x_hot; })
            .on("mouseout", function() { this.src=tw.viz.DEFAULT_IMAGES.x_hot; });

        // Overall error container

        var overall_error_div = modal_window.append("div")
            .attr("class", "csi_error_info_container csi_overall_error_container")
            .style("margin-top", "10px")
            .style("margin-left", "10px")
            .style("margin-bottom", "10px")
            .style("display", "none");

        overall_error_div.append("img")
            .attr("class", "flashFailureMsg")
            .attr("alt", "Failure Message")
            .attr("src", tw.viz.DEFAULT_IMAGES.error_icon);

        overall_error_div.append("span")
            .attr("class", "flashFailureMsg csi_overall_error");

        // Make modal windows draggable
        new Draggable(dialog_id, {
            handle: dialog_id + "csi_header",
            revert: function (el) {
                return !isElementInViewport(el);
            }
        });

        // Exit button click listener
        modal_window.select(".header_exit_button").on("click", cancel_func);

        return modal_window;
    },

    // Adds an item for CSI functionalities to the context menu.
    // 
    // menu_text_getter - Function that accepts node data and generates a text for context-menu item,
    // click_handler    - Function to handle when the context-menu item is clicked.
    //
    _addCSIContextMenuItems : function (menu_text_getter, click_handler) {
        "use strict";

        var si_create_permission    = this.options.si_create_permission || false,
            app_modelling_view_mode = (this.app_name !== undefined && this.options.view_mode);
        
        this.csi_nonce_token = this.options.nonce_token;

        this.CONTEXT_MENU_ITEMS["node"] =
            this.CONTEXT_MENU_ITEMS["node"].concat([
                [
                    bindContext(this, function (datum, target) {
                        if (datum.kind === this.csi_kind &&
                            !this.csi_in_progress &&
                            !this.isCollectionNode(datum) &&
                            si_create_permission) {

                            return menu_text_getter(datum);

                        } else {
                            return undefined;
                        }
                    }),
                    bindContext(this, function (datum, target) {
                        return (!app_modelling_view_mode && datum.kind === this.csi_kind);
                    }),
                    bindContext(this, click_handler),
                    app_modelling_view_mode ? "This functionality is disabled when viewing an application model" : ""
                ]
            ]);
    },

    // Shows the modal dialog whose contents are rendered by the given setup_func.
    // 
    // element      - Node data for the CSI on which user right-clicks on,
    // modal_window - Represents the current modal window,
    // setup_func   - Function to set up form inside the modal dialog,
    // cancel_func  - Function to call when the user presses ESC key while the dialog is active.
    //
    _showModalDialog : function (element, modal_window, setup_func, cancel_func) {
        "use strict";

        // Indicate CSI-related modal dialog is now active
        this.csi_in_progress = true;
        
        // Record the node on which user right-clicks on
        this.csi_target_node = element;

        // Register ESC key handler, pressing ESC should call cancel_func
        d3.select("body").on(this.esc_event_name, bindContext(this, function () {
            
            // Key code 27 is for Escape
            if (d3.event.keyCode === 27) {
                cancel_func();
            }

        }));
        
        // Set up the form inside the dialog
        setup_func();

        // Positioning the dialog box
        modal_window
            .style({
                display: "inline-block",
                top: 55 - this.in_div.node().getBoundingClientRect().top + "px"
            });
    },

    // Sets up a template for the modal dialog. Template data will be obtained from the backend (csi_ajax_url).
    // 
    // modal_window       - Represents the current modal window,
    // form_data          - Data to be included in the template data request,
    // error_display_func - Function to render if there is error resulting from the template data request,
    // post_rendered_func - Function to call once the template is put in place.
    //
    _setupTemplate : function (modal_window, form_data, error_display_func, post_rendered_func) {
        "use strict";
        
        tw.xhr_client.jsonGet(this.csi_ajax_url + "?" + Object.toQueryString(form_data),
            bindContext(this, function (error, response_data) {
                if (error) {
                    return;
                }

                if (response_data.errors !== undefined) {
                    error_display_func(response_data.errors);
                }
                else {
                    modal_window.append("div")
                        .attr("class", "valid_content")
                        .append("form")
                        .html(response_data.template_html);
                    
                    post_rendered_func(response_data);
                }
            }));
    },

    // Gets process information related to the CSI on which user right-clicks on.
    //
    // modal_window       - Represents the current modal window,
    // form_data          - Data to be included in the template data request,
    // error_display_func - Function to render if there is error resulting from the template data request,
    // post_process_func  - Function to be called once the process information is available.
    //
    _getProcessInformation : function (modal_window, form_data, error_display_func, post_process_func) {
        "use strict";

        // Disable "Create" button before condition is available
        modal_window.select(".csi_create").attr("disabled", "true");

        // Hide condition div as new condition is requested
        modal_window.selectAll(".csi_condition_after_loading").style("display", "none");

        // Show spinner as new condition is requested
        modal_window.selectAll(".csi_condition_loading_html").style("display", "inline-block");

        tw.xhr_client.jsonGet(this.csi_ajax_url + "?" + Object.toQueryString(form_data),
            bindContext(this, function (error, response_data) {
                if (error) {
                    return;
                }

                // Hide spinner
                modal_window.selectAll(".csi_condition_loading_html").style("display", "none");

                // Show condition div
                modal_window.selectAll(".csi_condition_after_loading").style("display", "inline-block");

                // Enable "Create" button. If there is an error, error_display_func should disable the Create button
                modal_window.select(".csi_create").attr("disabled", null);

                if (response_data.errors !== undefined) {
                    error_display_func(response_data.errors);
                }

                // Put condition and process count value to appropriate places
                modal_window.select(".csi_condition").text(response_data.condition_str);
                modal_window.select(".csi_process_count").text(response_data.process_count);

                post_process_func(response_data);
            }));
    },

    // Closes the modal dialog.
    //
    // modal_window - Represents the current modal window.
    //
    _closeModalDialog : function (modal_window) {
        "use strict";

        // Clear the condition field
        modal_window.select(".csi_condition").text("");

        // Clear the process count field
        modal_window.select(".csi_process_count").text("");

        // Enable the Create button
        modal_window.select(".csi_create").attr("disabled", null);

        // Hide all error containers
        modal_window.selectAll(".csi_error_info_container").style("display", "none");

        // Remove event handler.
        d3.select("body").on(this.esc_event_name, null);
        
        // Hide the modal window
        modal_window.style("display", "none");

        // Indicate CSI-related modal is not active
        this.csi_in_progress = false;
    },

    // Renders error information in the modal dialog.
    //
    // modal_window - Represents the current modal window,
    // error_data   - Error data to be used.
    //
    _renderErrorInfo : function (modal_window, error_data) {
        "use strict";

        // Hide overall error and form field error containers first
        modal_window.selectAll(".csi_error_info_container").style("display", "none");
        modal_window.selectAll("span.flashFailureMsg").text("");

        // For overall error
        if (error_data.csi_overall_error !== undefined) {
            modal_window.select(".csi_create")
                .attr("disabled", "true");

            modal_window
                .select(".csi_overall_error_container")
                .style("display", "inline-block");

            var error_message = error_data.csi_overall_error;
            modal_window
                .select(".csi_overall_error")
                .text(error_message);
        }

        // For form field error
        if (error_data.csi_form_error !== undefined) {

            // If it's a form error, reenable the Create button
            modal_window.select(".csi_create")
                .attr("disabled", null);

            d3.keys(error_data.csi_form_error).forEach(bindContext(this,
                function (error_key) {
                    modal_window
                        .select("." + error_key + "_container")
                        .style("display", "inline-block");
                    modal_window
                        .select("." + error_key)
                        .text(error_data.csi_form_error[error_key]);
            }));
        }
    },

    // Gets IDs of all CSIs in the visualization
    //
    _getAllCSIs : function () {
        "use strict";

        // Find out IDs of all CSIs in current visualization
        var csi_ids = [];
        d3.keys(this.nodes_map).forEach(bindContext(this, function (id) {
            var node_obj = this.nodes_map[id];
            if (node_obj.kind == this.csi_kind && !this.isCollectionNode(node_obj)) {
                csi_ids.push(node_obj.id);
            }
        }));

        return csi_ids;
    },

    // Opens the UI page - in a new tab - for modifying condition given in the modal dialog. 
    // It performs that by submitting the proved form data to the url that represents an 
    // advanced condition-modification page (e.g. SIPatternGeneration).
    //
    // url       - URL to which form data should be submitted to,
    // form_data - Form field values.
    // 
    _openModifyConditionPage : function (url, form_data) {
        "use strict";

        var form = d3.select(document.createElement("form"))
            .attr("method", "POST")
            .attr("action", url)
            .attr("target", "_blank");
        
        d3.keys(form_data).forEach(function (key) {
            var hidden_field = d3.select(document.createElement("input"))
                .attr("type", "hidden")
                .attr("name", key)
                .attr("value", form_data[key]);
            form.node().appendChild(hidden_field.node());
        });
        
        d3.select("body").node().appendChild(form.node());
        form.node().submit();
    }

});


// MixIn for Software Instance creation support.
//
tw.viz.SICreationMixIn = TWClass.create( tw.viz.CSIManagement, {

    sip_gen_url           : "SIPatternGeneration",  // SI Pattern Generation URL
    csi_modal_window      : undefined,              // Reference to the modal window
    csi_form_initialized  : false,                  // Indicates if the modal dialog is active
    csi_known_attr_names  : [],                     // Contains known attribute names of CSI node kind
    custom_attr_handler   : undefined,              // Reference to custom attribute handler

    // Constructs the SI Creation modal dialog. Contents of the dialog are not fully created yet at the 
    // end of this function as they will be loaded lazily when the dialog is open for the first time.
    //
    _constructSICreationModalDialog : function () {
        "use strict";

        this.csi_modal_window = this._constructModalDialog(
            "csi_modal_window",
            "Define Software Instance Pattern",
            bindContext(this, function () {
                d3.event.preventDefault();
                this._closeSICreationModalDialog();
            }));
    },

    // Adds SI Creation context menu item.
    //
    addSICreationContextMenuItem : function () {
        "use strict";

        var get_menu_text = function (d) {
                return "Create Software Instance";
            },
            show_modal = bindContext(this, function (d, element, top_position, scaled_position) {
                    this._showModalDialog(element, this.csi_modal_window, 
                        bindContext(this, this._renderSICreationTemplate, d), 
                        bindContext(this, function () {
                            d3.event.preventDefault();
                            this._closeSICreationModalDialog();
                        }));
                });

        this._addCSIContextMenuItems(get_menu_text, show_modal);
    },

    // Render template for SI Creation modal dialog window.
    //
    // d - Node data.
    //
    _renderSICreationTemplate : function (d) {
        "use strict";

        var check_type_exists = bindContext(this, function () {
            var element = this.csi_modal_window.select('.csi_si_type').node();
            tw.si_type_checker.checkType(element, "", "siTypeContainer");
        });

        // Function to fill form fields
        var fill_form_func = bindContext(this, function () {
            
            // Set SI Type value as short name of the CSI node clicked
            this.csi_modal_window.select(".csi_si_type").property("value", d.short_name);

            // Get condition and count information
            this._getProcessInformationForSICreation(d);

            // Check if the si_type (Name) already exists in datastore
            check_type_exists();
        });

        if (!this.csi_form_initialized) {

            // Form is not yet initialized, so, request template data and render now
            this._setupTemplate(
                this.csi_modal_window,
                { 
                    id     : d.id, 
                    action : "GetSICreationFormTemplate"
                },
                bindContext(this, this._renderErrorInfo, this.csi_modal_window),
                bindContext(this, function (response_data) {

                    // Assign known attribute names for adding custom attribute
                    this.csi_known_attr_names = response_data.known_attributes;

                    // Create button click listener
                    this.csi_modal_window.select(".csi_create").on("click",
                        bindContext(this, function () {
                            d3.event.preventDefault();

                            // TODO: Add Loading icon if the SI Creation takes longer
                            // than a few seconds. For now, I disable the Create button
                            // before the SI update information returns from the backend.
                            d3.select(d3.event.target).attr("disabled", "true");

                            this.createSoftwareInstance(
                                this._getSICreationFormData(this.csi_target_node.datum().id));
                        }));

                    // Cancel button click listener
                    this.csi_modal_window.select(".csi_cancel").on("click",
                        bindContext(this, function () {
                            d3.event.preventDefault();
                            this._closeSICreationModalDialog();
                        }));

                    // Clusterable label click listener
                    this.csi_modal_window.select(".csi_si_clusterable_label")
                        .on("click", bindContext(this, function () {
                            var checkbox   = this.csi_modal_window.select(".csi_si_clusterable"),
                                is_checked = checkbox.property('checked');

                            checkbox.property('checked', !is_checked);
                        }));

                    // Initialize custom attribute functionality
                    this.custom_attr_handler = new tw.CustomAttributes("csi_si_attributes_tbl", undefined, 
                                                                       this.csi_known_attr_names, undefined);

                    // Click handler for adding custom attribute
                    this.csi_modal_window.select(".add_custom_attr")
                        .on("click", bindContext(this, function() {
                            d3.event.preventDefault();
                            this.custom_attr_handler.addNewCustomAttribute();
                        }));

                    // Load the categories
                    this._loadSoftwareCategories(response_data.si_categories);

                    // Indicate form initialization is done
                    this.csi_form_initialized = true;

                    // As form is now available, fill the form fields
                    fill_form_func();

                    // Check if the si_type (Name) already exists in datastore
                    this.csi_modal_window.select(".csi_si_type")
                        .on("keyup", bindContext(this, check_type_exists));
                }));
        }
        else {
            // As form is already populated, just fill the form fields
            fill_form_func();
        }
    },

    // Gets process information for SI Creation.
    //
    // d - Node data.
    //
    _getProcessInformationForSICreation : function (d) {
        "use strict";

        var post_process_func = bindContext(this, function (response_data) {

            // Set up handler for "Modify Condition" url
            
            this.csi_modal_window.select(".modify_cond_url")
                .attr("href", "javascript:void(0)")
                .attr("target", "_blank")
                .on("click", bindContext(this, function () {
                    d3.event.preventDefault();

                    var form_data = {
                        reqhash                    : this.csi_nonce_token,
                        _tw_template_id            : response_data.holder_id,
                        form_state_si_type         : this.csi_modal_window.select(".csi_si_type").property("value"),
                        form_state_si_publisher    : this.csi_modal_window.select(".csi_si_publisher").property("value"),
                        form_state_si_category     : this.csi_modal_window.select(".csi_si_category").property("value"),
                        custom_attributes          : Object.toJSON(this.custom_attr_handler.getAllCustomAttributePairs())
                    };

                    var si_clusterable = this.csi_modal_window.select(".csi_si_clusterable").property("checked");
                    if (si_clusterable) {
                        form_data.form_state_si_clusterable = 'on';
                    }

                    this._openModifyConditionPage(this.sip_gen_url, form_data);
                }));
        });

        this._getProcessInformation(this.csi_modal_window,
            {
                id     : d.id, 
                action : "GetCandidateSIConditions"
            },
            bindContext(this, this._renderErrorInfo, this.csi_modal_window),
            post_process_func);
    },

    // Closes the SI Creation modal dialog.
    //
    _closeSICreationModalDialog : function () {
        "use strict";

        this._closeModalDialog(this.csi_modal_window);

        this.csi_modal_window.select(".csi_si_type").property('value', '');
        this.csi_modal_window.select(".csi_si_publisher").property('value', '');
        this.csi_modal_window.select(".csi_si_category").property('selectedIndex', 0);
        this.csi_modal_window.select(".csi_si_clusterable").property('checked', false);
        this.csi_modal_window.selectAll(".testWarning").style("display", "none");
        this.csi_modal_window.selectAll(".custom_attribute_tr").remove();
    },

    // Sets up Chosen library using the provided categories in drop-down field.
    // 
    // categories - SI Categories.
    // 
    _loadSoftwareCategories : function (categories) {
        "use strict";

        // Initialize the IDC categories
        // TODO: Modify to make use of D3 features (e.g. selectors)

        var cselect_main = this.csi_modal_window.select(".csi_si_category");

        categories.forEach(function (category) {
            cselect_main.append('option')
                .attr("value", category)
                .text(category);
        });

        var categories_select         = $$('.csi_si_category')[0];
        var csi_categories_chosen_obj = new Chosen(categories_select, {width: "100%"});
        var categories_input          = categories_select.next().down('input');
        var add_new_entry = function (e) {
            if (e.type !== 'blur' && e.keyCode !== 13) {
                return;
            }

            // Adding a category which is not in the list
            if (categories_select.next().down('.no-results') !== undefined) {

                // Create, insert and select the new option
                var new_option = new Element('option').insert(categories_input.value.escapeHTML());
                categories_select.insert(new_option);
                categories_select.selectedIndex = categories_select.childElements().size() - 1;

                // Update chosen and close the search dialog
                csi_categories_chosen_obj.results_update_field();
                csi_categories_chosen_obj.close_field();
                categories_select.simulate("change");
            }
        };

        categories_input.observe('keyup', add_new_entry);
        categories_input.observe('blur', add_new_entry);
    },

    // Gets form data for SI Creation.
    // 
    // target_node_id - ID of CSI on which user right-clicks on.
    //
    _getSICreationFormData : function (target_node_id) {
        "use strict";

        // Form data for creating SI
        var form_data = {
            reqhash             : this.csi_nonce_token,
            csi_clicked_id      : target_node_id,
            csi_ids             : Object.toJSON(this._getAllCSIs()),
            si_type             : this.csi_modal_window.select(".csi_si_type").property("value"),
            si_publisher        : this.csi_modal_window.select(".csi_si_publisher").property("value"),
            si_category         : this.csi_modal_window.select(".csi_si_category").property("value"),
            action              : "CreateSI",
            custom_attributes   : Object.toJSON(this.custom_attr_handler.getAllCustomAttributePairs())
        };

        // Indicate if the new SI to be created is clusterable
        var si_clusterable = this.csi_modal_window.select(".csi_si_clusterable").property("checked");

        if (si_clusterable) {
            form_data.si_clusterable = 'on';
        }

        return form_data;
    },

    // Creates Software Instances.
    // 
    // form_data  - Contains CSI-related data used for creation SIs.
    //
    createSoftwareInstance : function (form_data) {
        "use strict";

        tw.xhr_client.jsonPostForm(this.csi_ajax_url, form_data,
            bindContext(this, function (error, response_data) {
                if (error) {
                    return;
                }

                // Map from deleted relationship ID to new relationship ID
                var old_to_new_rels = {};

                if (response_data.errors === undefined) {

                    response_data.update_info.links.forEach(bindContext(this, function (link_data) {
                        old_to_new_rels[link_data.old_rel_id] = link_data.new_rel_id;
                    }));

                    var nodes_group = {};
                    this.node_sel.each(function (x) {
                        nodes_group[x.id] = d3.select(this);
                    });

                    var new_nodes = {};
                    var new_rels  = [];

                    d3.keys(response_data.update_info.nodes).forEach(bindContext(this, function (csi_id) {

                        var csi_node_removed = this.nodes_map[csi_id];
                        var new_si_info      = response_data.update_info.nodes[csi_id];

                        // So that these nodes are ignored when considering kind counts
                        csi_node_removed.fake = true;

                        // Remove deleted CSI node from view
                        this.hideNode(csi_node_removed);

                        // Add new SI node if it is not already created

                        var si_node_added = new_nodes[new_si_info.si_node_id];

                        if (si_node_added === undefined) {

                            si_node_added = {
                                id         : new_si_info.si_node_id,
                                depth      : 3,
                                kind       : new_si_info.kind,
                                name       : new_si_info.name,
                                root       : false,
                                short_name : new_si_info.short_name,
                                type       : new_si_info.type
                            };
                            new_nodes[new_si_info.si_node_id] = si_node_added;
                        }

                        // Copy edges

                        this.all_links.forEach(bindContext(this, function(link) {
                            if (link.src_id === csi_id) {

                                // Copy data from existing link object
                                var outgoing_edge    = copyObject(link);

                                // This link should no longer be considered as its source CSI has just been deleted
                                link.fake = true;

                                // Update only the neccessary property
                                outgoing_edge.id     = this._buildLinkId(si_node_added.id, link.tgt_id);
                                outgoing_edge.src_id = si_node_added.id;
                                outgoing_edge.source = si_node_added;
                                outgoing_edge.rel_id = old_to_new_rels[outgoing_edge.rel_id];

                                new_rels.push(outgoing_edge);
                            }
                            else if (link.tgt_id === csi_id) {

                                // Copy data from existing link object
                                var incoming_edge    = copyObject(link);

                                // This link should no longer be considered as its target CSI has just been deleted
                                link.fake = true;

                                // Update only the neccessary property
                                incoming_edge.id     = this._buildLinkId(link.src_id, si_node_added.id);
                                incoming_edge.tgt_id = si_node_added.id;
                                incoming_edge.target = si_node_added;
                                incoming_edge.rel_id = old_to_new_rels[incoming_edge.rel_id];

                                // If hosting type is CLUSTER and Host->SI link should be
                                // replaced by Cluster->SI

                                if (new_si_info.hosting_kind === "Cluster") {
                                    var cluster_node = this.nodes_map[new_si_info.si_host_id];

                                    incoming_edge.src_id = new_si_info.si_host_id;
                                    incoming_edge.source = cluster_node;
                                }

                                new_rels.push(incoming_edge);
                            }
                        }));

                    }));

                    var update_data = {
                        nodes : new_nodes,
                        links : new_rels
                    };

                    this._handleData(update_data, undefined, bindContext(this, function() {

                        // Update layout changes
                        this.updateLayout();

                        // Update required for changing labels to avoid overlapping
                        this.buildLabels(false, function() {});

                        // Highlight the new nodes

                        var nodes_group = {};
                        this.node_sel.each(function (x) {
                            nodes_group[x.id] = d3.select(this);
                        });

                        d3.keys(new_nodes).forEach(bindContext(this, function(key) {
                            var new_node   = new_nodes[key];
                            var node_g_obj = nodes_group[key];

                            var highlight_set_name = new_node.short_name;
                            this.highlightNode(node_g_obj.node(), highlight_set_name, true);
                        }));

                    }));

                    // SI is now successfully created, so close the modal dialog
                    this._closeSICreationModalDialog();
                }
                else {
                    this._renderErrorInfo(this.csi_modal_window, response_data.errors);
                }
            }));
    }

});


// MixIn for creating Candidate Software Instance Exclusion Rule.
//
tw.viz.CSIExclusionMixIn = TWClass.create( tw.viz.CSIManagement, {

    csie_rule_gen_url      : "CSIExclusionRuleGeneration",
    csie_modal_window      : undefined, // Reference to the modal dialog
    csie_form_initialized  : false,    // Indicate if the modal dialog is active
    
    // Constructs the CSI Exclusion modal dialog. Contents of the dialog are not fully created yet at the 
    // end of this function as they will be loaded lazily when the dialog is open for the first time.
    //
    _constructCSIExclusionModalDialog : function () {
        "use strict";

        this.csie_modal_window = this._constructModalDialog(
            "csie_modal_window",
            "Prevent Candidate Software Instance Creation",
            bindContext(this, function () {
                d3.event.preventDefault();
                this._closeCSIExclusionModalDialog();
            }));
    },

    // Adds SI Creation context menu item.
    //
    addCSIExclusionContextMenuItem : function () {
        "use strict";

        if (this.addRule === undefined) {
            throw Error("Rule MixIn is required.");
        }

        var get_menu_text = function (d) {
                return "Do not create " + d.short_name;
            },
            show_modal = bindContext(this, function (d, element, top_position, scaled_position) {
                    this._showModalDialog(element, this.csie_modal_window, 
                        bindContext(this, this._renderCSIExclusionTemplate, d), 
                        bindContext(this, function () {
                            d3.event.preventDefault();
                            this._closeCSIExclusionModalDialog();
                        }));
                });

        this._addCSIContextMenuItems(get_menu_text, bindContext(this, show_modal));
    },

    // Sets up template for CSI Exclusion modal dialog window.
    //
    // d - Node data.
    //
    _renderCSIExclusionTemplate : function (d) {
        "use strict";

        // Function to fill form fields
        var fill_form_func = bindContext(this, function () {
            
            // Set CSI Type value
            this.csie_modal_window.select(".csie_csi_type").text(d.short_name);

            // Use the CSI Type as a hint for the rule name
            this.csie_modal_window.select(".csie_rule_name").property("value", d.short_name);

            // Get condition and count information
            this._getProcessInformationForCSIExclusion(d);
        });

        if (!this.csie_form_initialized) {
            // Form is not yet initialized, so, request template data and render now
            this._setupTemplate(
                this.csie_modal_window,
                { 
                    id     : d.id, 
                    action : "GetCSIExclusionFormTemplate"
                },
                bindContext(this, this._renderErrorInfo, this.csie_modal_window),
                bindContext(this, function (response_data) {

                    // Create button click listener
                    this.csie_modal_window.select(".csi_create").on("click",
                        bindContext(this, function () {
                            d3.event.preventDefault();
                            this.csie_modal_window.select(".csi_create").attr("disabled", "true");
                            this.createCSIExclusionRule(this._getCSIExclusionFormData(this.csi_target_node.datum().id));
                        }));

                    // Cancel button click listener
                    this.csie_modal_window.select(".csi_cancel").on("click", 
                        bindContext(this, function () {
                            d3.event.preventDefault();
                            this._closeCSIExclusionModalDialog(); 
                        }));

                    // As form is now available, fill the form fields
                    fill_form_func();

                    // Indicate form initialization is done
                    this.csie_form_initialized = true;
                }));
        }
        else {
            // As form is already populated, just fill the form fields
            fill_form_func();
        }
    },

    // Gets process information for CSI Exclusion.
    //
    // d - Node data.
    //
    _getProcessInformationForCSIExclusion : function (d) {
        "use strict";

        var post_process_func = bindContext(this, function (response_data) {
            this.csie_modal_window.select(".modify_cond_url")
                .attr("href", "javascript:void(0)")
                .attr("target", "_blank")
                .on("click", bindContext(this, function () {
                    d3.event.preventDefault();

                    var form_data = {
                        reqhash                    : this.csi_nonce_token,
                        _tw_template_id            : response_data.holder_id,
                        form_state_csie_rule_name  : this.csie_modal_window.select(".csie_rule_name").property("value")
                    };

                    this._openModifyConditionPage(this.csie_rule_gen_url, form_data);
                }));
        });

        this._getProcessInformation(this.csie_modal_window,
            {
                id     : d.id, 
                action : "GetCandidateSIConditions"
            },
            bindContext(this, this._renderErrorInfo, this.csie_modal_window),
            post_process_func);
    },

    // Closes the CSI Exclusion modal dialog.
    //
    _closeCSIExclusionModalDialog : function () {
        "use strict";

        this._closeModalDialog(this.csie_modal_window);

        this.csie_modal_window.select(".csie_rule_name").property("value", "");
        this.csie_modal_window.select(".csie_csi_type").text("");
    },

    // Gets data from CSI Exclusion form.
    // 
    _getCSIExclusionFormData : function (target_node_id) {
        "use strict";

        return {
            reqhash        : this.csi_nonce_token,
            rule_name      : this.csie_modal_window.select(".csie_rule_name").property("value"),
            csi_clicked_id : target_node_id,
            csi_ids        : Object.toJSON(this._getAllCSIs()),
            action         : "CreateCSIExclusionRule"
        };
    },

    // Creates a global exclusion rule for CSI.
    // 
    // form_data  - Contains CSI-related data used for creating rule.
    //
    createCSIExclusionRule : function (form_data) {
        "use strict";

        tw.xhr_client.jsonPostForm(this.csi_ajax_url, form_data,
            bindContext(this, function (error, response_data) {
                if (error) {
                    return;
                }

                if (response_data.errors !== undefined) {
                    this._renderErrorInfo(this.csie_modal_window, response_data.errors);
                }
                else {
                    // CSI Exclusion Rule is now created, so close the modal dialog
                    this._closeCSIExclusionModalDialog();

                    // Add new rule to the common place
                    this.addRule(response_data.rule_data, true);
                }
            }));
    }
});



/* global d3, bindContext, TWClass */
/* jshint sub: true, nonew: false, scripturl: true */

// Inline visualization

if (tw === undefined) {
    var tw = {};
}
if (tw.viz === undefined) {
    tw.viz = {};
}

// Mixin for selection support.
//
tw.viz.SelectionMixIn = TWClass.create({

    // Selection lasso
    lasso_mode    : undefined,

    lasso_points  : undefined,
    lasso_bb      : undefined,
    lasso_origin  : undefined,
    lasso_path    : undefined,
    lasso_line    : undefined,
    lasso_close   : undefined,

    // Control object
    lasso_drag    : undefined,

    // Group object
    lasso_group   : undefined,

    lasso_started   : false,
    selection_state : undefined,

    addSelectionContextMenuItems : function () {
        "use strict";

        // Add to common menus

        var addSelectAllReviewSuggestedItem = function(d) {

            // Add menu item only if menu called on 'review suggested' node or
            // if called on visualization background but there is at least one
            // 'review suggested' node.
            if ((d && d.review_suggested) ||
                ((d === undefined) && this.someNodesAreReviewSuggested())) {
                return [
                    "Select all 'review suggested' nodes",
                    bindContext(this, this.canSelectAllReviewSuggested),
                    bindContext(this, this.selectAllReviewSuggested)
                ];
            }
        };

        this.CONTEXT_MENU_ITEMS["background"] =
            this.CONTEXT_MENU_ITEMS["background"].concat([
                [
                    labels.SelectAll,
                    bindContext(this, this.canSelectAll),
                    bindContext(this, this.selectAll)
                ],
                bindContext(this, addSelectAllReviewSuggestedItem),
                [
                    labels.ClearSelection,
                    bindContext(this, this.someNodesAreSelected),
                    bindContext(this, this.selectNone)
                ],
                [
                    labels.Invertselection,
                    bindContext(this, this.someNodesAreSelected),
                    bindContext(this, this.invertSelection)
                ],
                null,
                [
                    labels.KeepOnlySelected,
                    bindContext(this, this.allowSelectionRemoval),
                    bindContext(this, this.keepSelected),
                    bindContext(this, this.removeActionTooltip)
                ],
                [
                    labels.RemoveSelected,
                    bindContext(this, this.allowSelectionRemoval),
                    bindContext(this, this.removeSelected),
                    bindContext(this, this.removeActionTooltip)
                ]
            ]);

        // Function to add a context menu item just to selected node
        var bindToSelectedNode = function (text, d, target) {
            if (target.select("circle, rect").classed("selected")) {
                return text;
            }
        };

        this.CONTEXT_MENU_ITEMS["node"] =
            this.CONTEXT_MENU_ITEMS["node"].concat([
                [
                    bindContext(null, bindToSelectedNode, labels.ClearSelection),
                    true,
                    bindContext(this, this.selectNone)
                ],
                [
                    bindContext(null, bindToSelectedNode, labels.InvertSelection),
                    true,
                    bindContext(this, this.invertSelection)
                ],
                null,
                [
                    bindContext(null, bindToSelectedNode, labels.KeepOnlySelected),
                    bindContext(this, this.allowNodeRemoval),
                    bindContext(this, this.keepSelected),
                    bindContext(this, this.removeActionTooltip)
                ],
                [
                    bindContext(null, bindToSelectedNode, labels.RemoveSelected),
                    bindContext(this, this.allowNodeRemoval),
                    bindContext(this, this.removeSelected),
                    bindContext(this, this.removeActionTooltip)
                ],
                null,
                [
                    bindContext(this, function(d, target) {
                        if (target.select("circle, rect").classed("selected")) {
                            return labels.DeselectNode;
                        }
                        else if (this.someNodesAreSelected()) {
                            return labels.AddToSelection;
                        }
                        else {
                            return labels.SelectNode;
                        }
                    }),
                    true,
                    bindContext(this, this.toggleSelected),
                    bindContext(this, function (d, target) {
                        if (this.someNodesAreSelected()) {
                            if (target.select("circle, rect").classed("selected")) {
                                return labels.DeselectNodeTooltip;
                            }
                            else {
                                return labels.SelectNodeTooltip;
                            }
                        }
                    })
                ],
                bindContext(this, addSelectAllReviewSuggestedItem),
                [
                    function (d, target) {
                        if (!target.select("circle, rect").classed("selected")) {
                            return labels.RemoveNode;
                        }
                    },
                    bindContext(this, this.allowNodeRemoval),
                    bindContext(this, this.removeSingleNode),
                    bindContext(this, this.removeActionTooltip)
                ]
            ]);

        this.CONTEXT_MENU_ITEMS["link"] =
            this.CONTEXT_MENU_ITEMS["link"].concat([
                [ labels.SSTileRemoveLink, true, bindContext(this, this.removeSingleLink) ]
            ]);

    },

    // Whether to allow node removal (returning false disables context menu
    // actions responsible for node removal).
    //
    allowNodeRemoval : function () {
        "use strict";

        return true;
    },

    allowSelectionRemoval : function () {
        "use strict";

        return this.allowNodeRemoval() && this.someNodesAreSelected();
    },

    removeActionTooltip : function () {
        "use strict";

        if (!this.allowNodeRemoval()) {
            return "To remove nodes, first click the 'Edit Model' button above";
        }
    },

    addSelectionSideBarMenuItems : function () {
        "use strict";

        var objref = this;

        // Insert at index 1 to ensure it is always checked after
        // "Drag Mode".

        this.SIDE_BAR_MENU_ITEMS.splice(1, 0,

            function () {
                if (objref.mouse_mode !== 1) {
                    return [
                        false,
                        objref.options.images.select_normal,
                        labels.DragMode,
                        function () {
                            objref.selectMode();
                        },
                        { 'tooltip' : labels.SwitchToSelectMode,
                          'alt'     : 'Mouse mode is set to DRAG, click to set to SELECT',
						  'className': 'drag-mode'
						}
                    ];
                } else {
                    return [];
                }
            }
        );
    },

    _initSelectionControlObjects : function () {
        "use strict";

        this.lasso_drag = d3.behavior.drag()
            .on("dragstart", bindContext(this, this.lassoStart))
            .on("drag",      bindContext(this, this.lassoDrag))
            .on("dragend",   bindContext(this, this.lassoEnd));
    },

    _initSelectionGroupObjects : function () {
        "use strict";

        this.lasso_group = this.container
            .append("g")
            .attr("class", "lasso");
    },

    selectMode : function () {
        "use strict";

        this.mouse_mode = 1;

        // To disable pan ability on svg element
        this.svg.on("mousedown.zoom", null);

        this.back_rect.on(".drag", undefined);
        this.back_rect.call(this.lasso_drag);
        this.back_rect.style("cursor", "default");

        if (this.node_sel) {
            this.node_sel.selectAll("*").style("cursor", "default");
        }

        if (this.link_sel) {
            this.link_sel.call(this.lasso_drag);
            this.link_sel.style("cursor", "default");
        }

        /*d3.select("body").on("keydown.dragMode", bindContext(this, function() {
            // 27 is Escape
            if (d3.event.keyCode == 27) {
                this.dragMode();
                this.updateSideBarMenu();
            }
        }));*/

        return false;
    },

    nodeClickSelection : function (d, node) {
        "use strict";

        if (d3.event.defaultPrevented) {
            return;
        }

        if (this.selectionModeActive()) {
            // Drag / navigate mode -- handled by the <a>
            return;
        }

        d3.event.preventDefault();

        // Select mode
        var se            = d3.event,
            objref        = this,
            old_selection = this._getCurrentSelection();

        if (se.shiftKey) {
            // Add
            this._handleNodeSelection(node, true);
        }
        else if (se.ctrlKey) {
            // Remove
            this._handleNodeSelection(node, false);
        }
        else {
            // Replace
            this.node_sel.each(function() {
                objref._handleNodeSelection(this, false);
            });
            this._handleNodeSelection(node, true);
        }

        this._handleSelectionChange(old_selection);
    },

    selectionModeActive : function () {
        return this.mouse_mode !== 1;
    },

    _handleNodeSelection : function (node, selected) {
        "use strict";

        d3.select(node).select("circle, rect").classed("selected", selected);
    },

    //
    // Lasso

    // Check if a point is inside a given polygon.
    //
    pointInPolygon : function (point, vs, bb) {
        "use strict";

        // ray-casting algorithm based on
        // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
        //
        // JS version from http://bl.ocks.org/bycoffe/5575904
        //
        // Minor additional optimisation to check bounding box before
        // full ray-casting.

        var xi, yi, xj, yj, intersect,
            x = point[0],
            y = point[1],
            inside = false;

        if (x < bb[0] || y < bb[1] || x > bb[2] || y > bb[3]) {
            return false;
        }

        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            xi = vs[i][0];
            yi = vs[i][1];
            xj = vs[j][0];
            yj = vs[j][1];

            intersect = ((yi > y) != (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

            if (intersect) {
                inside = !inside;
            }
        }

        return inside;
    },

    _getCurrentSelection : function () {
        "use strict";

        var current_selection = {};

        this.node_sel.each(function(d) {
            var selected = d3.select(this).select("circle, rect")
                .classed("selected");

            if (selected) {
                current_selection[d.id] = true;
            }
        });
        return current_selection;
    },

    // Issue an event for selection change.
    //
    // old_selection - mandatory - the selection "before" event
    // new_selection - optional  - the current selection, or "after" event.
    //                             If not specified, defaults to current selection.
    //
    // Both selections should be obtained using _getCurrentSelection() method.
    //
    _handleSelectionChange : function (old_selection, new_selection) {
        "use strict";

        if (this.pushEvent !== undefined) {

            new_selection = new_selection || this._getCurrentSelection();

            this.pushEvent(this.EVENT_SELECTION_CHANGE, {
                old_selection     : old_selection,
                new_selection     : new_selection,
                undone            : false,
                undo : function (data) {
                    var objref = this;

                    this.node_sel.each(function(d) {
                        objref._handleNodeSelection(this,
                            data.old_selection[d.id] === true
                        );
                    });
                    return true;
                },
                redo : function (data) {
                    var objref = this;

                    this.node_sel.each(function(d) {
                        objref._handleNodeSelection(this,
                            data.new_selection[d.id] === true
                        );
                    });
                    return true;
                }
            });
        }
    },

    lassoStart : function () {
        "use strict";

        var se     = d3.event.sourceEvent,
            objref = this;

        if (se.button === 2) {
            // Suppress with right button, so that can show the context menu
            return;
        }

        // Close sidebar if the mixin is there
        if (this.closeSideBarExtendPanel !== undefined) {
            this.closeSideBarExtendPanel();
        }

        // Prevent things moving away from under us
        this.force.stop();

        // Save current selection state
        this.selection_state = this._getCurrentSelection();

        if (se.shiftKey) {
            // Add
            this.lasso_mode = 1;
        }
        else if (se.ctrlKey) {
            // Remove
            this.lasso_mode = 2;
        }
        else {
            // Replace
            this.lasso_mode = 0;
            this.node_sel.each(function() {
                objref._handleNodeSelection(this, false);
            });
        }

        var m = d3.mouse(this.container_node),
            x = m[0],
            y = m[1];

        this.lasso_points = [m];
        this.lasso_bb = [x, y, x, y];
        this.lasso_origin = this.lasso_group.append("circle")
            .attr("class", "origin")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 7);

        this.lasso_path = this.lasso_group.append("path")
            .attr("class", "drawn");

        this.lasso_close = this.lasso_group.append("path")
            .attr("class", "loop_close");

        this.lasso_line = d3.svg.line();

        //set the background cursor
        this.back_rect.style("cursor", "crosshair");

        this.lasso_started = true;
    },

    lassoDrag : function () {
        "use strict";

        if (!this.lasso_started)
            return;

        var m = d3.mouse(this.container_node),
            objref = this;

        this.lasso_points.push(m);

        this.lasso_bb = [ Math.min(this.lasso_bb[0], m[0]),
                          Math.min(this.lasso_bb[1], m[1]),
                          Math.max(this.lasso_bb[2], m[0]),
                          Math.max(this.lasso_bb[3], m[1]) ];

        this.lasso_path
            .attr("d", this.lasso_line(this.lasso_points));

        this.lasso_close
            .attr("d", this.lasso_line( [ this.lasso_points[ this.lasso_points.length - 1 ],
                                          this.lasso_points[0] ] ));

        if (this.lasso_mode == 2) {
            // Removing

            this.node_sel.each(function(d) {
                var circle = d3.select(this).select("circle, rect");

                if (circle.classed("selected")) {
                    var point = [d.x, d.y-d.y_offset];
                    circle.classed("removing",
                                   objref.pointInPolygon(point,
                                                         objref.lasso_points,
                                                         objref.lasso_bb));
                }
            });
        }
        else {
            // Adding
            this.node_sel.each(function(d) {
                var point = [d.x, d.y-d.y_offset];

                d3.select(this).select("circle, rect")
                    .classed("adding", objref.pointInPolygon(point,
                        objref.lasso_points, objref.lasso_bb));
            });
        }
    },

    lassoEnd : function () {
        "use strict";

        var objref = this;

        if (!this.lasso_started)
            return;

        this.node_sel.each(function(d) {
            var point  = [d.x, d.y-d.y_offset];
            var circle = d3.select(this).select("circle, rect");

            circle.classed("adding", false);
            circle.classed("removing", false);

            if (objref.pointInPolygon(point, objref.lasso_points, objref.lasso_bb)) {
                objref._handleNodeSelection(this, (objref.lasso_mode !== 2));
            }
        });
        this.back_rect.style("cursor", "default");
        this.lasso_group.selectAll("circle, rect").remove();
        this.lasso_group.selectAll("path").remove();

        var new_selection = this._getCurrentSelection();

        // if a current selection is not equal to a selection before using lasso
        // push the change event in undo/redo event_pump otherwise ignore it
        if (!this._isSelectionStatesEqual(this.selection_state, new_selection)) {
            this._handleSelectionChange(this.selection_state, new_selection);
        }
        var selectionCount = Object.keys(new_selection).length;
        if(selectionCount != 1){
            enableAnalyzeImpactButton(false);
        }else{
            updateDetailHeader();
            enableAnalyzeImpactButton(true);
        }
        enableLinkMenuItem(selectionCount);

        this.lasso_started = false;
        this.force.resume();
    },


    // Returns true if two selection states are equal
    // new_state, old_state - object in format:
    // {'node1_id' : true, 'node2_id': true ... }
    //
    _isSelectionStatesEqual : function (new_state, old_state) {
        "use strict";
        var ns_nodes = Object.keys(new_state),
            os_nodes = Object.keys(old_state);

        return ns_nodes.length === os_nodes.length &&
            ns_nodes.length === os_nodes.intersect(ns_nodes).length;
    },

    //
    // Selections

    keepSelected : function () {
        "use strict";

        var removed_nodes   = [],
            selected_ids    = this.getSelectedIds(),
            has_collections = this.isCollectionNode !== undefined;

        this.force.stop();
        this.force.on("tick", undefined);

        this.all_nodes.each(function(d) {
            // remove all the nodes that:
            //  - have not already been removed
            //  - are not selected

            // The node has already been removed, skip to the next one.
            if (d.removed) { return false; }

            var node_selected = selected_ids.indexOf(d.id) !== -1;

            if (!has_collections) {
                // Collections are not available for this viz, there are only
                // single nodes, just remove the node if it is not selected.
                if (!node_selected) {
                    removed_nodes.push(d);
                }
            }
            else {
                // Collections may be present, make sure that collection nodes
                // and collection members are handled properly.
                if (this.isCollectionNode(d)) {
                    // if a node is a collection, check if its members are selected
                    // or removed before removing it
                    var valid_members = d.members.some(function (member_id) {
                        var member = this.nodes_map[member_id];

                        if (member && !member.removed &&
                            selected_ids.indexOf(member_id) !== -1) {
                            return true;
                        }
                    }, this);

                    if (valid_members) {
                        // continue this.all_nodes.each loop - don't remove
                        // this collection as it has valid members
                        return false;
                    }
                    else if (!node_selected) {
                        removed_nodes.push(d);
                    }
                }
                else if (this.isCollectionMember(d)) {
                    // If a node is a collection member, check if its collection
                    // is expanded before removing it.
                    if (this.nodes_map[d.collection].expanded && !node_selected) {
                        removed_nodes.push(d);
                    }
                }
                else {
                    // Single node, just check if it is selected.
                    if (!node_selected) {
                        removed_nodes.push(d);
                    }
                }
            }
        }, this);

        this.removeNode(removed_nodes);

        // the selected nodes are the only nodes remaining - remove selection
        // indicators (will issue a selection change event)
        this.selectNone();

        if (this.pushEvent !== undefined) {
            this.pushEvent(this.EVENT_KEEP_SELECTED, {
                nodes      : removed_nodes,
                undone     : false,
                undo       : function (data) {
                    this.restoreNode(data.nodes);
                    return true;
                },
                redo : function (data) {
                    this.removeNode(data.nodes);
                    return true;
                }
            });
        }
    },

    removeSingleNode : function (d) {
        "use strict";

        this.removeNode(d);

        if (this.pushEvent !== undefined) {
            this.pushEvent(this.EVENT_REMOVE_NODE, {
                node       : d,
                undone     : false,
                undo       : function (data) {
                    this.restoreNode(data.node);
                    return true;
                },
                redo       : function (data) {
                    this.removeNode(data.node);
                    return true;
                }
            });
        }
    },

    // Remove the given link.
    //
    // May actually remove multiple links, if other links with the same rel_id
    // exist.
    //
    removeSingleLink : function (d) {
        "use strict";

        // Get all links with the same rel_id and make sure they are removed
        // (there may be multiple links with the same rel_id because of
        //  collections).

        var links = this.all_links.filter(function (link) {
            return link.rel_id === d.rel_id;
        });

        // removed = true for all links (undefined -> no callback)
        this._setVisibilityFlag(links, true, false);
        this.refreshLayout();

        if (this.pushEvent !== undefined) {
            this.pushEvent(this.EVENT_REMOVE_LINK, {
                links      : links,
                undone     : false,
                undo       : function (data) {
                    this._setVisibilityFlag(data.links, false, false);
                    this.refreshLayout();
                    return true;
                },
                redo       : function (data) {
                    this._setVisibilityFlag(data.links, true, false);
                    this.refreshLayout();
                    return true;
                }
            });
        }
    },

    // Remove the currently selected nodes from view.
    //
    removeSelected : function () {
        "use strict";

        this.force.stop();
        this.force.on("tick", undefined);

        var selected_nodes = {};

        this.node_sel.each(function(d) {
            var t = d3.select(this).select("circle, rect");
            if (t.classed("selected")) {
                selected_nodes[d.id] = d;
            }
        });

        // Issue EVENT_SELECTION_CHANGE - change selection from current
        // selection to nothing.
        // Do this for undo to work as expected:
        // - select nodes           (selection change: nothing to current sel.)
        // - remove selected        (selection change: current sel. to nothing)
        // - undo remove selected
        // - undo selection change  (restore original selection before remove)
        this.selectNone();

        this.removeNode(d3.values(selected_nodes));

        if (this.pushEvent !== undefined) {
            this.pushEvent(this.EVENT_REMOVE_SELECTED, {
                nodes      : d3.values(selected_nodes),
                undone     : false,
                undo       : function (data) {
                    this.restoreNode(data.nodes);
                    return true;
                },
                redo : function (data) {
                    this.removeNode(data.nodes);
                    return true;
                }
            });
        }
    },

    selectAll : function (push_event) {
        "use strict";

        push_event = push_event === undefined ? true : push_event;

        var objref        = this,
            old_selection = this._getCurrentSelection();

        this.node_sel.each(function(d) {
            if (d.visible) {
                // only select visible nodes to avoid nasty surprises with
                // data consistency
                objref._handleNodeSelection(this, true);
            }
        });
		var selectionCount = this.node_sel[0].length;
        if(selectionCount > 1){
            enableAnalyzeImpactButton(false);
        }
        enableLinkMenuItem(selectionCount);
        if (push_event) {
            this._handleSelectionChange(old_selection);
        }
    },

    selectAllReviewSuggested : function (push_event) {
        "use strict";

        push_event = push_event === undefined ? true : push_event;

        var objref        = this,
            old_selection = this._getCurrentSelection();

        // Deselect all previous selected nodes
        this.selectNone();
        this.node_sel.each(function(d) {
            if (d.review_suggested && d.visible) {
                objref._handleNodeSelection(this, true);
            }
        });

        if (push_event) {
            this._handleSelectionChange(old_selection);
        }
    },

    selectNone : function (push_event) {
        "use strict";

        push_event = push_event === undefined ? true : push_event;

        var objref        = this,
            old_selection = this._getCurrentSelection();

        this.node_sel.each(function() {
            objref._handleNodeSelection(this, false);
        });
        enableAnalyzeImpactButton(false);
        enableLinkMenuItem(0);
        if (push_event) {
            this._handleSelectionChange(old_selection);
        }
    },

    // Invert current selection.
    //
    // This will only select visible nodes!
    //
    invertSelection : function (push_event) {
        "use strict";

        push_event = push_event === undefined ? true : push_event;

        var old_selection = this._getCurrentSelection();

        this.node_sel.each(function(d) {
            var path = d3.select(this).select("circle, rect");

            if (d.visible) {
                path.classed("selected", !path.classed("selected"));
            }
        });

        if (push_event) {
            this._handleSelectionChange(old_selection);
        }
    },

    toggleSelected : function (d, target) {
        "use strict";

        var path          = target.select("circle, rect"),
            old_selection = this._getCurrentSelection();

        path.classed("selected", !path.classed("selected"));
		var prevSelLength = Object.keys(old_selection).length;
		if((path.classed("selected") && prevSelLength === 0) || (!path.classed("selected") && (prevSelLength - 1) == 1)) {
			selectedNode = d;
			updateDetailHeader(d);
			enableAnalyzeImpactButton(true);
		} else {
			enableAnalyzeImpactButton(false);
		}
        if(path.classed("selected")){            
            enableLinkMenuItem(prevSelLength+1);            
        }else{
            enableLinkMenuItem(prevSelLength-1); 
        }

        this._handleSelectionChange(old_selection);
    },

    // Returns true if some nodes are currently selected, otherwise returns false.
    //
    someNodesAreSelected : function () {
        "use strict";

        return this.node_sel[0].some(function(node) {
            return d3.select(node).select("circle, rect").classed("selected");
        });
    },

    // Returns true if some nodes are marked as 'review suggested'
    someNodesAreReviewSuggested : function () {
        "use strict";
        return this.node_sel[0].some(function(node) {
            return d3.select(node).select("circle, rect").classed("review-suggested");
        });
    },

    // Returns true if at least one node isn't currently selected.
    // Used to enable "Select all" option.
    canSelectAll : function () {
        "use strict";

        return !this.node_sel[0].every(function(node) {
            return d3.select(node).select("circle, rect").classed("selected");
        });
    },

    // Returns true if at least one 'review suggested' node is not selected.
    // Used to enable "Select all in 'review suggested'" option.
    canSelectAllReviewSuggested : function () {
        "use strict";

        var rs = this.node_sel[0].filter(function(node) {
            return d3.select(node).select("circle, rect").classed("review-suggested");
        });

        return !rs.every(function(node) {
            return d3.select(node).select("circle, rect").classed("selected");
        });
    },

    countSelected : function () {
        "use strict";

        return this.getSelectedIds().length;
    },

    getSelectedIds : function () {
        "use strict";

        return d3.keys(this._getCurrentSelection());
    },

    // State persistence
    //

    _getSelectionVizStateForNode : function (n, state) {
        "use strict";

        // TODO BETA rename "visible" flag to "hidden"
        // (that's what it really is and should ever be)
        // "visible" is too generic and misleading.
        //
        // "hidden" is only used for hiding expanded collections, etc.
        //
        // Also, when hiding nodes with the show/hide menu, node.visible will be
        // set to false (this shouldn't not persisted though).

        state["extra_data"]["visible"] = !n.hidden;

        return true;
    }
});


/* global d3, bindContext, TWClass, debounce, messageBoardRaise,
   messageBoardClose, arrayToSet, showConfirmDialog, encodeHTML */
/* jshint sub: true, nonew: false, scripturl: true */

if (tw === undefined) {
    var tw = {};
}
if (tw.viz === undefined) {
    tw.viz = {};
}

// Mixin for rules and shared nodes.
//
tw.viz.RulesMixIn = TWClass.create({

    rules                       : [],        // Array of rules.

    rules_div_container         : undefined, // Holds the DOM div container that encompasses
                                             // controls for individual rules.
    save_changes_button         : undefined,

    // Node picker.
    node_picker_root            : undefined, // Root node of the node picker.

    // Node picker selections.
    link_dim                    : undefined,
    node_dim                    : undefined,
    text_dim                    : undefined,
    manual_group_indicators_dim : undefined,
    node_bright                 : undefined,

    // List of node kinds for which never show rule can be applied
    node_kinds_for_never_show: [
        "SoftwareInstance",
        "SoftwareInstance_SO",
        "SoftwareInstance_VM",
        "SoftwareCluster",
        "SoftwareComponent",
        "Database"
    ],

    // List of node kinds for which don`t follow rule can be applied
    node_kinds_for_dont_follow: [
        "SoftwareInstance",
        "SoftwareInstance_SO",
        "SoftwareInstance_VM"
    ],

    // List of node kind for which node.type should be used as node label in removal rules menu
    node_kinds_for_type_as_node_label: [
        "SoftwareInstance",
        "SoftwareCluster",
        "SoftwareInstance_SO",
        "SoftwareInstance_VM"
    ],

    // List of node kind for which node.short_name should be used as node label in removal rules
    // menu
    node_kinds_for_short_name_as_node_label: [
        "SoftwareComponent",
        "Database"
    ],

    // Map to store humanized names of groups to display in sidebar menu
    side_bar_group_name_humanized: {
        pending_create: "Pending Save",
        pending_delete: "Pending Delete",
        saved         : "Saved"
    },

    RULE_TYPE_EXCLUDE           : "never_show",
    RULE_TYPE_DONT_FOLLOW       : "do_not_follow",

    // Similar to RULE_TYPE_DONT_FOLLOW but without specifying any target
    RULE_TYPE_DONT_FOLLOW_ANY   : "do_not_follow_any",

    NOT_IN_A_MODEL_VIEW_MSG     : "Choose 'Edit Model' to make changes",
    
    shared_overrides            : [],

    // Initialize the rules components.
    //
    initRules : function () {
        "use strict";

        this.dismissMessageBoardDelayed = debounce(
            messageBoardClose,
            this.options.side_bar_highlight_timeout
        );

        if (!this.app_mod_editor_mode) {
            this._addSaveChangesButton();
        }
    },

    // Function for adding button "Save Exclusion Rules" to the visualization right button bar
    //
    _addSaveChangesButton: function() {
        "use strict";

        var inline_viz_span = d3.select("#showInlineVizSpan").node();

        if (!inline_viz_span) {
            return;
        }

        var button_bar = d3.select(inline_viz_span.parentNode);

        this.save_changes_button = button_bar.insert("input", "#showInlineVizSpan")
            .attr("type", "button")
            .attr("value", "Save Changes")
            .style({ display: "none" });

        // Check user permission

        if (this.options.app_publish_permission) {
            this.save_changes_button
                .classed("primary save-exclusion-rules-button", true)
                .on("click", bindContext(this, function() {
                    this.confirmUpdateGlobalRules();
                }));
        } else {
            this.save_changes_button
                .attr("title", "You do not have permission to save changes")
                .attr("alt", "You do not have permission to save changes")
                .classed("disabled", true)
                .node().disabled = true;
        }
    },

    // Function, that based on amount of pending rules show/hide "Save Exclusion Rules" button
    //
    updateSaveChangesButton: function() {
        "use strict";

        if (!this.app_mod_editor_mode && !this.app_start_modelling) {
            this.save_changes_button
                .style("display", (this.getPendingRules().length ||
                                   this.getPendingSharedOverrides().length) ? null
                                                                            : "none");

            // Execute any additional layout changes that should be reflected by presence of button
            // on a screen (Ex: in SearchVisualization, the position of query builder should be changed)
            if (this.updateLayoutForSaveChangesButton) {
                this.updateLayoutForSaveChangesButton();
            }
        }
    },

    // Get an array of currently pending rules.
    //
    getPendingRules : function () {
        "use strict";

        return this.rules.filter(function (rule) {
            return rule.pending;
        });
    },

    // Set rules for the current visualization.
    //
    // rules {array} - array of rules, received from backend.
    //
    setRulesVizState: function(rules) {
        "use strict";

        this.updateRules(rules);
        if (this.updateSideBarMenu) {
            this.updateSideBarMenu();
        }
        if (this.updateRemovalRulesSidebar) {
            this.updateRemovalRulesSidebar();
        }
        this.updateSaveChangesButton();
    },

    // Loop over new rules and depending of rule with same id existence
    // update it or add to rules list, without overwriting this.rules
    // rules {array} - array of new rules, received from backend.
    //
    updateRules: function(rules) {
        "use strict";

        if (!this.rules.length) {
            this.rules = rules;
        }
        else {
            rules.forEach(function(new_rule) {
                var existing_rule = this.rules.find(function(rule) {
                    return rule.id === new_rule.id;
                });

                if (existing_rule) {
                    Object.keys(new_rule).forEach(function(rule_prop) {
                        if (!existing_rule[rule_prop]) {
                            existing_rule[rule_prop] = new_rule[rule_prop];
                        }
                    });
                }
                else {
                    this.rules.push(new_rule);
                }
            }, this);
        }
    },

    // Construct sidebar for rules management. Function constructs a div with
    // class "viz-sb-list-container" inside the container, then calls sidebar
    // update function.
    //
    constructRemovalRulesSidebar: function(container) {
        "use strict";

        this.rules_div_container = container.append("div")
            .classed({
                "viz-sb-list-container"        : true,
                "exclusion-rules-sidebar__list": true
            });

        this.updateRemovalRulesSidebar();
    },

    // Update the sidebar to contain controls for rules affecting the current
    // visualization (this.rules).
    //
    // This uses d3.data and this._ruleIndex to identify rules.
    //
    // Assumes that the rules sidebar has been constructed
    // (constructRemovalRulesSidebar). Does nothing if it wasn't.
    //
    updateRemovalRulesSidebar: function() {
        "use strict";

        var rules_list = this.rules_div_container;

        if (!rules_list) {
            // sidebar not created (yet), nothing to update
            return;
        }

        rules_list.html("");

        if (!this.rules || !this.rules.length) {
            this._renderEmptyTabMessage();
        }
        else {
            this._renderRemovalRulesGroups();
        }
    },

    // Function that processes removal rules, and calls rendering of a sidebar menu group for
    // each of them
    //
    _renderRemovalRulesGroups: function() {
        "use strict";

        var list = this.rules_div_container,
            group_collapsed = false,
            segmented_rules = this._segmentRules();

        Object.keys(segmented_rules).forEach(function(rules_key) {
            var rules              = segmented_rules[rules_key],
                group,
                group_options;

            if (rules.length) {
                group_options = {
                    container     : list,
                    group_class   : "exclusion-rules-group_" + rules_key,
                    collapsed     : group_collapsed,
                    expandable    : true,
                    group_name    : this.side_bar_group_name_humanized[rules_key],
                    group_sub_name: rules.length + " rule" + (rules.length > 1 ? "s" : ""),
                    group_actions : bindContext(this, this.renderRemovalRuleActions,
                        rules_key, rules)
                };

                group_collapsed = true;

                group = this.createSideBarMenuGroup(group_options);

                rules.forEach(function(rule) {
                    this.renderRemovalRuleItem(group.body, rules_key, rule);
                }, this);
            }
        }, this);
    },

    // In case of no exclusion rules are applied renders an empty message into removal rules tab
    //
    _renderEmptyTabMessage: function() {
        "use strict";

        var empty_message;

        if (this.app_name === undefined) {
            empty_message = "No rules apply to this visualization";
        }
        else {
            empty_message = "Removal rules are not shown in application models";
        }

        this.rules_div_container.append("div")
            .attr("class", "remove-sidebar-empty")
            .text(empty_message);

    },

    // Render the rule item in rules sidebar.
    //
    // item_div - d3 selection (div) for the root element to render into.
    // rule     - rule data (Object).
    //
    renderRemovalRuleItem: function(element, rules_key,  rule) {
        "use strict";

        var item_div = element.append("div"),
            icon_class = "removal-rule_pending",
            icon_title = "Unsaved rule, only affecting the current visualization";

        item_div.classed("viz-sb-list-item", true);

        if (rule.global) {
            icon_class = "removal-rule_global";
            icon_title = "Global rule, affecting all application models and visualizations";
        }
        else if (rule.local) {
            icon_class = "removal-rule_local";
            icon_title = "Local rule, only affecting current application model";
        }

        // Rule icon.
        var rule_icon = item_div
            .append("div")
            .attr("class", "viz-sb-list-item__icon " + icon_class)
            .attr("title", icon_title);

        this.renderRemovalRuleActions(rules_key, rule, item_div);

        item_div
            .append("div")
            .classed("viz-sb-list-item__name nowrap-line", true)
            .attr("title", rule.description)
            .text(rule.description);

        if (rule.match_count !== undefined) {
            item_div
                .append("span")
                .classed("rule-count-badge", true)
                .attr("title", "Number of times this rule triggered")
                .text(rule.match_count);

            // Move a bit to the right for showing "match count"
            rule_icon.style("margin-left", "20px");
        }
    },

    // Function that renders an button to manipulate exclusion rules into a provided DOM Element
    // render_save_button {boolean} flat indicating a need to render save button(applies to
    // only pending rules)
    // rules              {Object}, or Array of Objects representing exclusion rules
    // container          {D3 Wrapper over DOM Element} into which buttons should be rendered
    //
    renderRemovalRuleActions: function(rules_key, rule, container) {
        "use strict";

        // For Bobblehat (11.1.0): disable rule action buttons in model editor
        //
        // (Main reason being it can create non-linear history and it's not
        //  obvious what should happen when you cancel a pending rule.
        //  Also we don't show saved rules at all for models.)
        if (this.app_mod_editor_mode) {
            return;
        }

        var rules = Array.isArray(rule) ? rule : [rule],
            action_button_class = { "viz-sb-list-item__button": true },
            action_button_title, action_button_callback,
            event_name, event_undo_callback;

        if (rules_key === "pending_create") {
            action_button_class["removal-rule-action_cancel"] = true;
            action_button_title    = "Cancel rule creation";
            action_button_callback = this.cancelPendingRuleCreation;
            event_name             = this.EVENT_CANCEL_CREATE_EXCLUSION_RULES;
            event_undo_callback    = this.reCreatePendingRule;
        }
        else if (rules_key === "pending_delete") {
            action_button_class["removal-rule-action_cancel"] = true;
            action_button_title    = "Cancel rule deletion";
            action_button_callback = this.cancelSavedRuleDeletion;
            event_name             = this.EVENT_CANCEL_DELETE_EXCLUSION_RULES;
            event_undo_callback    = this.markSavedRuleForDeletion;
        }
        else if (rules_key === "saved") {
            action_button_class["removal-rule-action_delete"] = true;
            action_button_title    = "Delete rule";
            action_button_callback = this.markSavedRuleForDeletion;
            event_name             = this.EVENT_DELETE_EXCLUSION_RULES;
            event_undo_callback    = this.cancelSavedRuleDeletion;
        }
        else {
            console.log("Unable to construct rule actions, rule can`t be segmented correctly");
            return;
        }


        container.append("button")
            .classed(action_button_class)
            .attr("type", "button")
            .attr("title", action_button_title)
            .on("click", bindContext(this, function() {
                var viz_state = this.getVizState();

                // prevent the sidebar from closing
                d3.event.stopPropagation();
                action_button_callback.call(this, rules);
                this._onRuleSaveDeleteCallback(true);

                if (event_name && this.pushEvent) {
                    this.pushEvent(event_name,
                        {
                            rules_data: rules,
                            viz_state : viz_state,
                            undone    : false,
                            undo      : bindContext(this, function(data) {
                                event_undo_callback.call(this, data.rules_data);
                                this._onRuleSaveDeleteCallback(true);
                                return true;
                            }),
                            undo_name: bindContext(this, this._neverShowUndoRedoName),
                            redo     : bindContext(this, function(data) {
                                action_button_callback.call(this, data.rules_data);
                                this._onRuleSaveDeleteCallback(true);
                                return true;
                            }),
                            redo_name: bindContext(this, this._neverShowUndoRedoName)
                        }
                    );
                }
            }));

        // TODO: local rules disabled for bobblehat
    },

    // Segment all exclusion rules into three types pending_create, pending_delete and saved
    //
    _segmentRules: function() {
        "use strict";

        var segmented_rules = {
            pending_create: [],
            pending_delete: [],
            saved         : []
        };

        this.rules.forEach(function(rule) {
            if (rule.pending) {
                if (rule.operation === "create") {
                    segmented_rules.pending_create.push(rule);
                }
                else if (rule.operation === "delete") {
                    segmented_rules.pending_delete.push(rule);
                }
            }
            else {
                segmented_rules.saved.push(rule);
            }
        });

        return segmented_rules;
    },

    // Add rules context menu items.
    //
    addRulesContextMenuItems : function () {
        "use strict";
        var app_modelling_view_mode = this.app_name !== undefined && this.options.view_mode,
            ITEM_PREFIX = "\u2000\u2022 ";

        var addLabelItem = function (datum) {

            if (this.qualifiesForNeverShow(datum)) {

                var label = this.nodeLabelForRuleMenu(datum);
                return [
                    label,
                    false,
                    undefined,
                    "Define rules for " + label
                ];
            }
        };

        var addNeverShowItem = function (datum) {

            if (this.qualifiesForNeverShow(datum)) {

                var entry = ITEM_PREFIX + "Never show";

                // Check if the current visualization is not an app modelling
                // editor instance.
                if (app_modelling_view_mode) {
                    return [
                        entry,
                        false,
                        undefined,
                        this.NOT_IN_A_MODEL_VIEW_MSG
                    ];
                }

                var label = this.nodeLabelForRuleMenu(datum);
                return [
                    entry,
                    true,
                    bindContext(this, function (datum) {
                        this.createRule(this.RULE_TYPE_EXCLUDE, datum);
                    }),
                    "Never show " + label + " in visualizations or application models"
                ];
            }
        };

        var addDontFollowAnythingItem = function(root_d) {

            if (this.qualifiesForDontFollowAny(root_d)) {
                var entry = ITEM_PREFIX + "Do not follow any connections";

                if (app_modelling_view_mode) {
                    return [
                        entry,
                        false,
                        undefined,
                        this.NOT_IN_A_MODEL_VIEW_MSG
                    ];
                }

                return [
                    entry,
                    true,
                    bindContext(this, this.createRule, this.RULE_TYPE_DONT_FOLLOW_ANY, undefined, root_d),
                    "Do not follow any connections from " + this.nodeLabelForRuleMenu(root_d)
                ];
            }
        };

        var addDontFollowItem = function(root_d) {

            var objref    = this,
                isFit     = function (d) {
                    return objref.directlyLinked(root_d, d) && objref.qualifiesForNeverShow(d);
                },
                fit_nodes = this.node_sel.filter(isFit),
                entry     = ITEM_PREFIX + "Do not follow connections to ...";

            if (this.qualifiesForNeverShow(root_d)) {

                if (app_modelling_view_mode) {
                    return [
                        entry,
                        false,
                        undefined,
                        this.NOT_IN_A_MODEL_VIEW_MSG
                    ];
                }

                var label = this.nodeLabelForRuleMenu(root_d);

                // Enable item only in case if there are some relationships that
                // may be excluded.
                if (fit_nodes.size() > 0) {
                    return [
                        entry,
                        true,
                        bindContext(this, this.turnNodePickerOn, fit_nodes),
                        "Do not follow connections from " + label + " to a chosen node type"
                    ];
                }

                return [
                    entry,
                    false,
                    undefined,
                    "No connections were followed from here"
                ];
            }
        };

        this.CONTEXT_MENU_ITEMS["node"] =
            this.CONTEXT_MENU_ITEMS["node"].concat(
                null,
                bindContext(this, addLabelItem),
                bindContext(this, addNeverShowItem),
                bindContext(this, addDontFollowAnythingItem),
                bindContext(this, addDontFollowItem)
            );
    },

    // Tell if a particular node qualifies for "never show" exclusion rule.
    //
    qualifiesForNeverShow: function(datum) {
        "use strict";

        return (
            ((this.node_kinds_for_never_show.indexOf(datum.kind) > -1) && datum.type) ||

            (this.isCollectionNode(datum) && datum.member_kinds.SoftwareInstance &&
             datum.member_kinds.SoftwareInstance > 0)
        );
    },

    // Tell if a particular node qualifies for "don't follow any" exclusion rule.
    //
    qualifiesForDontFollowAny: function(datum) {
        "use strict";

        return (
            ((this.node_kinds_for_dont_follow.indexOf(datum.kind) > -1) && datum.type) ||

            (this.isCollectionNode(datum) && datum.member_kinds.SoftwareInstance &&
             datum.member_kinds.SoftwareInstance > 0)
        );
    },

    // Return a "label" identifying the node for usage in menus dealing
    // with rules.
    //
    nodeLabelForRuleMenu : function(datum) {
        "use strict";

        // TODO some of this logic is repeated in the backend (ModelRules.py)

        if (this.isCollectionNode(datum)) {
            return datum.short_name;
        }

        if (this.node_kinds_for_type_as_node_label.indexOf(datum.kind) > -1) {
            return datum.type;
        }

        if (this.node_kinds_for_short_name_as_node_label.indexOf(datum.kind) > -1) {
            return datum.short_name;
        }

        return datum.short_name;
    },

    getNodeIdsToExclude : function(datum) {
        "use strict";

        if (datum === undefined) {
            return [];
        }
        else if (this.isCollectionNode(datum)) {
            // Pass all the collection members (the backend will work out what
            // rules to create and which nodes to exclude)
            return datum.members;
        }
        else {
            // Not a collection: singular node
            return [datum.id];
        }
    },

    // Create removal rule(s).
    //
    // rule_type {string}      - the rule type, e.g. "never_show" or
    //                           "do_not_follow".
    // node {node object}      - the node for which to create the rule. Can be
    //                           a collection.
    // from_node {node object} - the node for which to create the rule. Can be
    //                           a collection. Can be undefined if the rule type
    //                           doesn't require it. Currently only
    //                           "do_not_follow" rules require from_node.
    // push_event {bool}       - (default: true) - whether to push an event
    //                           to the event pump.
    //
    createRule : function (rule_type, node, from_node, push_event) {
        "use strict";
        push_event = push_event === undefined ? true : push_event;

        var new_rule_data = {
            type      : rule_type,
            viz_state : this.getVizState(),
            node_ids  : this.getNodeIdsToExclude(node),
            rules     : this.getPendingRules()
        };

        if (rule_type === this.RULE_TYPE_DONT_FOLLOW || rule_type === this.RULE_TYPE_DONT_FOLLOW_ANY) {
            if (from_node) {
                new_rule_data.from_node_ids = this.getNodeIdsToExclude(from_node);
            }
            else {
                console.log("Error: from_node unspecified for " + rule_type + " rule");
                return;
            }
        }

        this.sendCreatePendingRule(new_rule_data, false, bindContext(this, function(error, new_rules) {
            if (error) {
                console.log("Error creating exclusion rule", new_rule_data);
                return;
            }

            if (new_rules.length === 0) {
                // The requested rule(s) already exist - no need to update
                // the UI and push "undo create 0 rules" event
                return;
            }

            new_rules.forEach(function(rule) {
                this.addRule(rule, false);
            }, this);

            this.updateSaveChangesButton();

            // We only need to "apply" all the rules once.
            this.applyRules();

            if (push_event && this.pushEvent !== undefined) {
                this.pushEvent(this.EVENT_CREATE_EXCLUSION_RULES, {
                    rules_data: new_rules,
                    viz_state : new_rule_data.viz_state,
                    rule_type : rule_type,
                    undone    : false,
                    undo      : bindContext(this, function(data) {
                        this.cancelPendingRuleCreation(data.rules_data);
                        this._onRuleSaveDeleteCallback(true, data.viz_state);
                        return true;
                    }),
                    undo_name: bindContext(this, this._neverShowUndoRedoName),
                    redo     : bindContext(this, function(data) {
                        this.reCreatePendingRule(data.rules_data);
                        this._onRuleSaveDeleteCallback(true);
                        return true;
                    }),
                    redo_name: bindContext(this, this._neverShowUndoRedoName)
                });
            }
        }));
    },

    // Sending API requests creating pending rules.
    //
    // This can create multiple rules, as the API expects an array of IDs.
    //
    // new_rules {array of objects}   - object, representing the rule which is to be created.
    //                                  Can contain keys: "node_ids" or "rules_data".
    // callback {function} - optional, gets called just after the API response arrives.
    //                       Standard d3 callback arguments for XHR are used: error, response.
    //
    sendCreatePendingRule: function(new_rules, save, callback) {
        "use strict";

        tw.xhr_client.jsonRequest(
            this.options.pending_rule_api_url + "?req_hash=" + this.options.nonce_token,
            "POST",
            JSON.stringify(new_rules),
            bindContext(this, function(error, data) {
                if (error) {
                    if (callback) {
                        callback(error, data);
                    }

                    return;
                }

                var num     = data.length,
                    plural  = num !== 1,
                    message_board_arguments;

                if (this.highlightSideBarMenu) {
                    this.highlightSideBarMenu("Removed Nodes");
                    this.removeSideBarMenuHighlightDelayed("Removed Nodes");
                }

                if (num === 0) {
                    message_board_arguments = [
                        "The requested rule already exists",
                        "Did not create a rule",
                        true,   // critical (red background)
                        true
                    ];
                }
                else {
                    message_board_arguments = [
                        plural ? (num + " new unsaved rules have been created.") :
                                  "1 new unsaved rule has been created",
                        "Rule" + (plural ? "s" : "") + " created",
                        false,
                        true,
                        bindContext(this, this.openRulesTabAndDismissMessageBoard)
                    ];
                }

                messageBoardRaise.apply(this, message_board_arguments);
                this.dismissMessageBoardDelayed();

                if (callback) {
                    callback(error, data);
                }
            })
        );
    },

    // Generic function for sending API requests updating rules and shared overrides.
    //
    // This can create multiple rules, as the API expects an array of IDs.
    //
    // data_to_update : { rules_data : [], shared_overrides : [] } - lists of rules and shared
    //                                                               overrides to update.
    // callback {function} - optional, gets called just after the API response arrives.
    //                       Standard d3 callback arguments for XHR are used: error, response.
    //
    sendUpdateGlobalRules : function (data_to_update, callback) {
        "use strict";

        tw.xhr_client.jsonRequest(
            this.options.rule_operations_api_url + "?req_hash=" + this.options.nonce_token,
            "POST",
            JSON.stringify(data_to_update),
            bindContext(this, function(error, data) {
                var rules_saved       = data.rules.length,
                    rules_deleted     = data_to_update.rules_data.length - rules_saved,
                    do_highlight      = rules_saved || rules_deleted,

                    forced_shared     = data.shared_overrides
                        .filter(function (o) { return o.value; }).length,
                    forced_not_shared = data.shared_overrides
                        .filter(function (o) { return o.value === false; }).length,
                    overrides_deleted = data_to_update.shared_overrides.length - forced_shared - forced_not_shared,
                    message           = "";

                if (!error) {
                    if (this.highlightSideBarMenu && do_highlight) {
                        this.highlightSideBarMenu("Removed Nodes");
                        this.removeSideBarMenuHighlightDelayed("Removed Nodes");
                    }

                    if (rules_saved) {
                        message += rules_saved + " rule" +
                            (rules_saved === 1 ? " has" : "s have") + " been saved. ";
                    }

                    if (rules_deleted) {
                        message += rules_deleted + " rule" +
                            (rules_deleted === 1 ? " has" : "s have") + " been deleted. ";
                    }

                    if (forced_shared) {
                        message += forced_shared + " node" +
                            (forced_shared === 1 ? " has" : "s have") + " been forced to shared. ";
                    }

                    if (forced_not_shared) {
                        message += forced_not_shared + " node" +
                            (forced_not_shared === 1 ? " has" : "s have") + " been forced to not shared. ";
                    }

                    if (overrides_deleted) {
                        message += "The system will decide whether " + overrides_deleted +
                            (overrides_deleted === 1 ? " node is" : " nodes are") + " shared. ";
                    }
                    var message_board_arguments = [
                        message,
                        "The changes have been saved",
                        false,
                        true,
                        bindContext(this, this.openRulesTabAndDismissMessageBoard)
                    ];

                    messageBoardRaise.apply(this, message_board_arguments);
                    this.dismissMessageBoardDelayed();
                }

                if (callback) {
                    callback(error, data);
                }
            })
        );
    },

    // Function for rule evaluation.
    // Gets viz state, adds array of rules and array of root nodes to it, sends
    // it to the backend and in case of success passes response to the callback.
    //
    // viz_state - (for models) the visualization state to use for re-evaluation.
    //             If undefined, extracts the current state using getVizState().
    //
    sendEvalRules: function(viz_state, system_added_only) {
        "use strict";

        var data = {};

        this.showSpinner();

        if (this.app_mod_editor_mode) {
            // editing an application model

            var url = this.options.rule_evaluation_api_url +
                      "?req_hash=" + this.options.nonce_token;

            if (viz_state === undefined) {
                viz_state = this.getVizState();
            }

            data.viz_state        = viz_state;
            data.rules            = this.getPendingRules();
            data.shared_overrides = this.getPendingSharedOverrides();

            if (this.app_start_modelling) {
                // creating new ModelDefinition - indicate by null ID
                data.model_id = null;
            }
            else {
                // editing an existing one
                data.model_id = this.data_id;
            }

            if (system_added_only !== undefined) {
                data.system_added_only = system_added_only;
            }
            
            // Body-based JSON parameters
            tw.xhr_client.jsonRequest(
                url,
                "POST",
                JSON.stringify(data),
                bindContext(this, function(error, response_data) {
                    this.replaceVizState(response_data);
                    this.hideSpinner();
                })
            );
        }
        else {
            // non-model visualization

            // TODO use root ids to construct the URL (avoid search result timeout)

            // TODO ideally re-evaluation for visualizations should behave the
            // similarly to re-evaluation for models

            // Form-based parameters
            data.rules            = JSON.stringify(this.getPendingRules());
            data.shared_overrides = JSON.stringify(this.getPendingSharedOverrides());

            tw.xhr_client.jsonPostForm(this._buildRequestInitialDataUrl(), data,
                bindContext(this, function(error, response_data) {
                    if (error) {
                        return;
                    }

                    this.replaceVizState(response_data);
                    this.hideSpinner();
                })
            );
        }
    },

    // Generic function for applying arbitrary rules.
    //
    applyRules : function (viz_state, system_added_only) {
        "use strict";

        // Activate the "Removal Rules" tab if something has happened to the
        // rules (rule created or deleted, etc).
        this.activateRemovalRulesTab();

        this.sendEvalRules(viz_state, system_added_only);

        // Because applying rule changes the states of the world, invalidate
        // the cache in model extension mixin
        if (this.invalidateRelatedNodesCache) {
            this.invalidateRelatedNodesCache();
        }

    },

    // Ask for confirmation before saving pending changes.
    // Calls `updateGlobalRules` on confirm. and bypass parameters
    //
    confirmUpdateGlobalRules: function() {
        "use strict";
        var segmented_rules     = this._segmentRules(),
            create_rules        = segmented_rules.pending_create,
            delete_rules        = segmented_rules.pending_delete,
            rules_text          = "",
            segmented_overrides = this._segmentSharedOverrides(),
            create_overrides    = segmented_overrides.pending_create,
            delete_overrides    = segmented_overrides.pending_delete,
            overrides_text      = "";

        if (create_rules.length) {
            rules_text += (create_rules.length === 1) ? "This rule " : "These rules ";
            rules_text += "will be created:" + this.prepareUpdateRulesList(create_rules);
        }

        if (delete_rules.length) {
            rules_text += (delete_rules.length === 1) ? "This rule " : "These rules ";
            rules_text += "will be deleted:" + this.prepareUpdateRulesList(delete_rules);
        }

        if (create_overrides.to_shared.length) {
            overrides_text += (create_overrides.to_shared.length === 1) ? "This node "
                                                                        : "These nodes ";
            overrides_text += "will be forced to shared:" +
                this.prepareUpdateRulesList(create_overrides.to_shared);
        }

        if (create_overrides.to_not_shared.length) {
            overrides_text += (create_overrides.to_not_shared.length === 1) ? "This node "
                                                                            : "These nodes ";
            overrides_text += "will be forced to not shared:" +
                this.prepareUpdateRulesList(create_overrides.to_not_shared);
        }

        if (delete_overrides.length) {
            overrides_text += "The system will decide whether ";
            overrides_text += (delete_overrides.length === 1) ? "this node is shared:"
                                                              : "these nodes are shared:";
            overrides_text += this.prepareUpdateRulesList(delete_overrides);
        }

        showConfirmDialog(
            "Save changes?",

            rules_text + overrides_text +

            "<p>Modifying rules will affect " +
            "<em>all</em> visualizations and application models. New nodes " +
            "that match removal rules will not be automatically added to " +
            "application models.</p>",

            bindContext(this, function() {
                this.updateGlobalRules();
            })
        );
    },

    // Build a stringify html list with rules to display
    // rules {array of objects} rules, whose description should be displayed in a list
    //
    prepareUpdateRulesList: function(rules) {
        "use strict";
        var text = "<ol>";

        rules.forEach(function(rule) {
            text = text + "<li>" + encodeHTML(rule.description) + "</li>";
        });

        text = text + "</ol>";

        return text;
    },

    // Save pending changes to exclusion rules and shared overrides.
    // This is not undoable.
    //
    // callback {Function} - function to execute after changes have been saved.
    //
    updateGlobalRules: function(callback) {
        "use strict";

        var pending_data = {
                rules_data       : this.getPendingRules(),
                shared_overrides : this.getPendingSharedOverrides()
            };

        if (!pending_data.rules_data.every(function(rule) { return rule.pending; })) {
            // TODO support local/model specific rules
            console.log("Error: can't make a non-pending rule global");
            return;
        }

        this.sendUpdateGlobalRules(pending_data, bindContext(this, function(error, new_data) {
            if (error) {
                console.log("Error converting rule into a global one", pending_data.rules_data);
                return;
            }

            // clean-up rules list, and leave untouched only global rules
            this.rules = this.rules.filter(function(rule) {
                return rule.global;
            });

            // Add new rules to the internal rule array if they have "match count" more than 0.
            // Possible to receive rules with "match count" 0 when pending rules are saved in
            // application modelling editor.
            Array.prototype.push.apply(this.rules, new_data.rules.filter(function (rule) {
                return rule.match_count > 0;
            }));

            this._markPendingSharedOverridesAsSaved(new_data.shared_overrides);

            // We don't need to "apply" the rule - it's already been applied
            // when created. We need to update the rules sidebar though and save all button.
            this._onRuleSaveDeleteCallback(false);

            // clean undo/redo stack
            if (this.eraseUndoRedoStack) {
                this.eraseUndoRedoStack();
            }

            if (callback) {
                callback();
            }
        }));
    },

    // Add a new rule to the internal array of rules
    //
    // new_rule     - New rule to be added,
    // should_apply - Flag if the new rule should be applied after adding. If Yes,
    //                applyRules is called with "create" action
    addRule : function (new_rule, should_apply) {
        "use strict";

        this.rules.push(new_rule);

        if (should_apply) {
            this.applyRules();
        }
    },

    // Execute set of operations with visualization to update its state according to current
    // removal rules
    // reapply_rules {boolean} flag, indicating a need to re "apply" rules, and replaceVizState
    //
    _onRuleSaveDeleteCallback: function(reapply_rules, viz_state) {
        "use strict";

        this.updateSideBarMenu();
        this.updateRemovalRulesSidebar();
        this.updateSaveChangesButton();

        if (reapply_rules) {
            this.applyRules(viz_state);
        }
    },

    // Perform cancellation of pending rule creation
    // This deletes rules created before from rules array.
    //
    cancelPendingRuleCreation: function(rules_for_cancellation) {
        "use strict";

        var to_be_cancelled = {
            descriptions : arrayToSet(rules_for_cancellation.map(function (r) {
                return r.description;
            })),
            identities : arrayToSet(rules_for_cancellation.map(function (r) {
                return r.id;
            }))
        };

        // Check the rule by comparing ID. Pending rules don't have valid Datastore ID yet, so
        // virtual id is generated by deterministically hashing (rule type, condition and from_condition)
        // in the backend. However, since there can be a hash collision, also use the description
        // to reduce that likelihood.

        this.rules = this.rules.filter(function(rule) {
            return (
                to_be_cancelled.identities[rule.id] === undefined &&
                to_be_cancelled.descriptions[rule.description] === undefined
            );
        });
    },

    // Perform creation of rules that were deleted using "Undo" or "cancelPendingRuleCreation"
    // This pushes rules created before back to rules array.
    //
    reCreatePendingRule: function(rules_for_saving) {
        "use strict";

        rules_for_saving.forEach(function(rule) {
            this.rules.push(rule);
        }, this);
    },

    // Moves rules back from "pending_delete" sate to "saved"
    //
    cancelSavedRuleDeletion: function(rules_for_cancellation) {
        "use strict";

        rules_for_cancellation.forEach(function(rule) {
            delete rule.operation;
            delete rule.pending;
            rule.global = true;
        });
    },

    // Moves rules from "saved" sate to "pending_delete" state
    //
    markSavedRuleForDeletion: function(rules_for_deletion) {
        "use strict";

        rules_for_deletion.forEach(function(rule) {
            delete rule.global;
            rule.pending   = true;
            rule.operation = "delete";
        });
    },

    // Create a label to display on hovering on undo/redo buttons
    //
    _neverShowUndoRedoName: function(data) {
        "use strict";

        var count = Array.isArray(data.rules_data) ? data.rules_data.length : 1,
            op    = "", desc;

        if (data.event === this.EVENT_CREATE_EXCLUSION_RULES) {
            op = "creation";
        }
        else if (data.event === this.EVENT_DELETE_EXCLUSION_RULES) {
            op = "deletion";
        }
        else if (data.event === this.EVENT_CANCEL_CREATE_EXCLUSION_RULES) {
            op = "cancel creation";
        }
        else if (data.event === this.EVENT_CANCEL_DELETE_EXCLUSION_RULES) {
            op = "cancel deletion";
        }

        if (count === 1) {
            desc = Array.isArray(data.rules_data) ? data.rules_data[0].description :
                data.rules_data.description;

            return op + " of rule '" + desc + "'";
        }
        else {
            return op + " of " + count + " rules";
        }
    },

    // Switch the visualization into the node picker mode. This will dim all nodes
    // which are not directly connected to the node picker's root.
    //
    // node_bright - nodes which are directly connected to the root of the node
    //               picker and should not be dimmed.
    // root_d      - datum of the node picker's root node.
    // target      - node picker's root node itself (DOM node).
    //
    turnNodePickerOn : function (node_bright, root_d, target) {
        "use strict";

        var objref = this,
            isDim = function (d) {
                return !objref.directlyLinked(root_d, d) || !objref.qualifiesForNeverShow(d);
            },
            isDimRel = function (d) {
                return (root_d.id !== d.src_id && root_d.id !== d.tgt_id) ||
                        !objref.qualifiesForNeverShow(d.source) ||
                        !objref.qualifiesForNeverShow(d.target);
            };

        this.node_bright = node_bright;

        this.node_picker_mode = true;
        this.node_picker_root = d3.select(target.node());
        this.back_rect.on("click.pick", function () {

            // D3 prevents the default behavior for a click event that immediately
            // follows a non-empty drag gesture. In such a case (defaultPrevented === true)
            // node picker shouldn't be turned off.
            if (d3.event.defaultPrevented) {
                return;
            }
            objref.turnNodePickerOff();
        });

        this.link_dim = this.link_sel.filter(isDimRel);
        this.node_dim = this.node_sel.filter(isDim);
        this.text_dim = this.text_sel.filter(isDim);
        this.manual_group_indicators_dim = this.manual_group_indicators_sel.filter(isDim);

        // Dim everything which is not directly connected to the root of the
        // node picker.
        this.link_dim.style("opacity", 0.2);
        this.node_dim.style("opacity", 0.2);
        this.text_dim.style("opacity", 0.2);
        this.manual_group_indicators_dim.style("opacity", 0.2);

        // Add appropriate event listeners to nodes which are directly
        // connected to the root of the node picker.
        this.node_bright.each(function (d) {
            var node = d3.select(this);

            node
                .on("mouseover.pick", function () {
                    node.select("circle, rect")
                        .classed("pick", true);

                    objref.cursor_tooltip.style("display", "none");
                })
                .on("mouseout.pick", function () {
                    node.select("circle, rect")
                        .classed("pick", false);

                    objref.cursor_tooltip.style("display", "inline");
                })
                .on("click.pick", function () {
                    node.select("circle, rect")
                        .classed("pick", false);

                    objref.createRule(objref.RULE_TYPE_DONT_FOLLOW, d, root_d);
                    objref.turnNodePickerOff();
                });
        });

        // Turn node picker off when Esc key is pressed.
        d3.select("body").on("keydown.pick", function () {
            if (d3.event.keyCode === 27) {
                objref.turnNodePickerOff();
            }
        });

        // Highlight the root of the node picker.
        this.node_picker_root
            .style("opacity", 1)
            .select("circle, rect")
            .classed("pick", true);

        this.showVizCursorTooltip("Select destination");
    },

    // Switch the visualization back to normal state.
    //
    turnNodePickerOff : function () {
        "use strict";

        this.hideVizCursorTooltip();

        this.node_picker_mode = false;
        this.back_rect.on(".pick", null);

        this.link_dim.style("opacity", 1);
        this.node_dim.style("opacity", 1);
        this.text_dim.style("opacity", 1);
        this.manual_group_indicators_dim.style("opacity", 1);

        this.node_bright.on(".pick", null);
        d3.select("body").on(".pick", null);

        this.node_picker_root
            .select("circle, rect")
            .classed("pick", false);

        this.node_picker_root = undefined;

        // Set all selections used by the node picker to undefined.
        this.link_dim = this.node_dim = this.text_dim = this.manual_group_indicators_dim = this.node_bright = undefined;
    },

    // Tell if the visualization is in the node picker mode.
    //
    isNodePickerOn : function () {
        "use strict";

        return this.node_picker_mode === true;
    },

    // Mark the "Removal Rules" tab as active.
    //
    // should_open - flag to indicate if the tab should be opened after activation.
    //
    activateRemovalRulesTab: function (should_open) {
        "use strict";

        if (this.activateSideBarTab) {
            this.activateSideBarTab("Removed Nodes", 1, should_open);
        }
    },

    // Open the "Removal Rules" tab and dismiss the message board.
    //
    openRulesTabAndDismissMessageBoard : function () {
        "use strict";

        messageBoardClose();
        this.activateRemovalRulesTab(true);
    },

    /**
     * Handles "shared" nodes and their actions.
     *
     * Requires: CollectionsMixIn (not strictly enforced, but not tested without it)
     *
     * The logic for manipulating shared overrides is this:
     *  - If it's a single node
     *      -> Allow overrides if kind is not in HOSTING_KINDS or
     *                                           SHARED_NO_OVERRIDE_NODE_KINDS
     *  - If a collection has shared overrides
     *      -> Only allow "clearing" the override
     *  - If there's only shared things
     *      -> Allow overriding things that are shared to non-shared
     *  - If there's only non-shared things
     *      -> Allow overriding things that are non-shared to shared
     *  - If there's a mix of shared and non-shared
     *      -> Allow overriding shared things to non-shared things only, leaving
     *         non-shared things alone
     *
     * TODOs:
     *
     * - tests
     */

    // Node kinds that can't be considered shared
    // (should follow HOSTING_KINDS in analysis/settings.py)
    HOSTING_KINDS : ["Host",
                     "Cluster",
                     "MFPart",
                     "LoadBalancerInstance",
                     "HardwareContainer",
                     "HostContainer",
                     "Mainframe",
                     "CloudService",
                     "CloudRegion",
                     "CloudProvider",
                     "AdminCollection"],

    // Node kinds that can't be used in shared flag overrides
    // (should follow SHARED_NO_OVERRIDE_NODE_KINDS in analysis/settings.py)
    SHARED_NO_OVERRIDE_NODE_KINDS : ["CandidateSoftwareInstance"],

    addSharedNodesContextMenuItems : function () {
        "use strict";

        var app_modelling_view_mode = this.app_name !== undefined && this.options.view_mode,
            addUpdateOverrideItem = function (datum) {
            // delete ALWAYS takes precedence, if we can delete

            var is_collection  = this.isCollectionNode && this.isCollectionNode(datum),
                override_ids   = is_collection ? this._collectionValueMembersToOverride(datum)[1]
                                               : [datum.id],
                is_pending     = this._sharedOverrideUpdatePendingForNode(override_ids),
                has_permission = this.sharedPermittedToOverride(),
                can_delete     = this.sharedCanDeleteOverrideForNode(datum),
                can_override   = this.sharedCanOverrideForNode(datum),
                override_to    = this.sharedOverrideTo(datum),
                enabled        = can_delete || can_override,
                entry          = bindContext(this, function (datum) {
                    if (can_delete) {
                        return "Let the system decide if shared";
                    }

                    if (can_override) {
                        if (override_to === true) {
                            return "Force to shared";
                        }
                        else if (override_to === false) {
                            return "Force to not shared";
                        }
                    }

                    // else... (should be grayed out with a meaningful
                    //          tooltip)

                    var kind_overridable;

                    if (is_collection) {
                        kind_overridable = this.collectionSharedOverridableMembersCount(datum);
                    }
                    else {
                        kind_overridable = this.HOSTING_KINDS.indexOf(datum.kind) === -1 &&
                                           this.SHARED_NO_OVERRIDE_NODE_KINDS.indexOf(datum.kind) === -1;
                    }

                    /*if (kind_overridable) {
                        return "Shared override";
                    }*/

                });

            if (app_modelling_view_mode) {
                return [
                    entry,
                    false,
                    undefined,
                    this.NOT_IN_A_MODEL_VIEW_MSG
                ];
            }

            return [
                // label
                entry,

                // enabled
                enabled,

                // callback
                bindContext(this, function (datum) {
                    if (can_delete) {
                        return is_pending ? this._cancelPendingUpdateForSharedOverride(override_ids, false)
                                          : this._createPendingUpdateForSharedOverride(datum, null);
                    }
                    else if (can_override) {
                        return is_pending ? this._cancelPendingUpdateForSharedOverride(override_ids, false)
                                          : this._createPendingUpdateForSharedOverride(datum, override_to, override_ids);
                    }
                }),

                // tooltip
                bindContext(this, function () {
                    if (!has_permission) {
                        return "You do not have permission to manipulate " +
                            "shared overrides";
                    }
                    if (can_delete) {
                        return "No longer override the default behavior, " +
                            "and allow the system to decide if this node " +
                            "is shared";
                    }
                    if (can_override) {
                        if (override_to === true) {
                            return "Override the default behavior and " +
                                "consider this node to be shared";
                        }
                        else if (override_to === false) {
                            return "Override the default behavior and " +
                                "do not consider this node to be shared";
                        }
                    }
                    // can't delete, can't override - a mix of
                    return "Inconsistent shared node status";
                })
            ];
        };

        this.CONTEXT_MENU_ITEMS.node =
            this.CONTEXT_MENU_ITEMS.node.concat(
                null, // separator
                bindContext(this, addUpdateOverrideItem)
            );
    },

    /**
     * Tell if the specified node can be overridden.
     *
     * @returns {boolean}
     */
    sharedCanOverrideForNode : function (datum) {
        "use strict";

        if (!this.sharedPermittedToOverride()) {
            return false;
        }

        if (this.isCollectionNode && this.isCollectionNode(datum)) {
            if (datum.members_shared_override.length > 0) {
                // overrides exist - delete them first to allow setting
                // a new override value
                return false;
            }

            return this.collectionShouldProxySharedOverrides(datum) ||
                (this._collectionValueMembersToOverride(datum)[0] !== null);
        }
        else {
            // not a collection (single node)
            return this.HOSTING_KINDS.indexOf(datum.kind) === -1 &&
                   this.SHARED_NO_OVERRIDE_NODE_KINDS.indexOf(datum.kind) === -1;
        }
    },

    /**
     * Tell if the specified node can have its override(s) deleted / cleared.
     *
     * @returns {boolean}
     */
    sharedCanDeleteOverrideForNode : function (datum) {
        "use strict";

        if (!this.sharedPermittedToOverride()) {
            return false;
        }

        if (this.isCollectionNode && this.isCollectionNode(datum)) {
            // allow deletes if there are ANY overrides in the collection
            // -> that reverts default (system set) shared values

            // this should take precedence over setting an override value
            // -> allows to break out of "I must have an override value set"
            //    situation

            return datum.members_shared_override.length > 0;
        }
        else {
            // not a collection (single node)
            return (datum.shared_override === true) ||
                (datum.shared_override === false);
        }
    },

    /**
     * Tell whether the current visualization / logged in user is permitted to
     * manipulate shared overrides.
     *
     * @returns {boolean}
     */
    sharedPermittedToOverride : function () {
        "use strict";

        // Publish permission controls whether shared flag can be overriden
        return this.options.app_publish_permission;
    },

    /**
     * Tell the logical "shared" flag value for a node.
     *
     * @returns {boolean} is this node shared?
     */
    sharedValueForNode : function (datum) {
        "use strict";

        if (!this.isCollectionNode ||
            (this.isCollectionNode && !this.isCollectionNode(datum))) {
            // not a collection

            if (datum.shared === undefined) {
                return false;
            }

            return datum.shared;
        }

        // definitely a collection.
        return this.collectionHasSharedMembers(datum);
    },

    /**
     * Tell if the "shared" value has been overridden for a given node.
     *
     * @returns {boolean}
     */
    sharedValueOverriddenForNode : function (datum) {
        "use strict";

        if (!this.isCollectionNode ||
            (this.isCollectionNode && !this.isCollectionNode(datum))) {
            // not a collection
            return datum.shared_override !== null;
        }

        // definitely a collection.
        return this._collectionHasSharedOverriddenMembers(datum);
    },

    /**
     * If the node is overridable, what should be the value to override?
     *
     * @returns {boolean}
     */
    sharedOverrideTo : function (datum) {
        "use strict";

        if (this.isCollectionNode && this.isCollectionNode(datum)) {
            return this._collectionValueMembersToOverride(datum)[0];
        }

        return !datum.shared;
    },

    /**
     * Tell if the collection node has any members that are shared.
     * If so, the collection should be indicated as a shared node.
     *
     * @returns {boolean}
     */
    collectionHasSharedMembers : function (collection) {
        "use strict";

        return collection.members_shared && collection.members_shared.length >= 1;
    },

    /**
     * Tell if the collection node has any members with overridden "shared" value.
     *
     * @returns {boolean}
     */
    _collectionHasSharedOverriddenMembers : function (collection) {
        "use strict";

        return collection.members_shared_override &&
               collection.members_shared_override.length >= 1;
    },

    /**
     * Tell if the collection should "proxy" all shared override manipulation.
     * This should happen when the collection only contains one overridable
     * member.
     *
     * @returns {boolean}
     */
    collectionShouldProxySharedOverrides : function (collection) {
        "use strict";

        return (this.collectionSharedOverridableMembersCount(collection) === 1) &&
            (this.collectionSharedNonOverridableMembersCount(collection) === 0);
    },

    /**
     * Count shared, overridable members in a collection.
     *
     * @returns {number}
     */
    collectionSharedOverridableMembersCount : function (collection) {
        "use strict";

        var overridable_count = 0;

        Object.keys(collection.member_kinds).forEach(function (kind) {
            if (this.HOSTING_KINDS.indexOf(kind) === -1 &&
                this.SHARED_NO_OVERRIDE_NODE_KINDS.indexOf(kind) === -1) {
                overridable_count += collection.member_kinds[kind];
            }
        }, this);

        return overridable_count;
    },

    /**
     * Count shared, but not overridable members in a collection.
     *
     * @returns {number}
     */
    collectionSharedNonOverridableMembersCount : function (collection) {
        "use strict";

        var non_overridable_count = 0;

        this.SHARED_NO_OVERRIDE_NODE_KINDS.forEach(bindContext(this, function (kind) {
            non_overridable_count += (collection.member_kinds[kind] || 0);
        }));

        return non_overridable_count;
    },

    /**
     * Return the value to which the collection members should be overridden to
     * and an array of member IDs to override.
     *
     * If override_value is null, the collection cannot be overridden.
     *
     * @returns {[boolean|null, String[]]} [override_value, ["member_id", "member_id", ...]]
     */
    _collectionValueMembersToOverride : function (collection) {
        "use strict";

        var new_value       = null,
            member_ids      = [],
            num_shared      = collection.members_shared.length,
            num_not_shared  = collection.members_not_shared.length;

        // case 1: only shared things
        if ((num_shared > 0) && (num_not_shared === 0)) {
            new_value  = false;
            member_ids = collection.members_shared;
        }
        // case 2: only not shared things
        else if ((num_shared === 0) && (num_not_shared > 0)) {
            new_value  = true;
            member_ids = collection.members_not_shared;
        }
        // case 3: a mix of shared and not shared stuff:
        //         mark everything that's shared as not shared
        else if ((num_shared > 0) && (num_not_shared > 0)) {
            new_value  = false;
            member_ids = collection.members_shared;
        }

        return [new_value, member_ids];
    },


    // Sharedness awareness for collections (CollectionsMixIn should call these)
    //-------------------------------------------------------------------------


    /**
     * Apply post-processing to handle a possibly shared member being
     * added to a collection.
     */
    sharedPostAddMemberToCollectionNode : function (member, collection) {
        "use strict";

        // maintain shared members arrays for consistency
        if (member.shared) {
            collection.members_shared.push(member.id);
        }
        else {
            collection.members_not_shared.push(member.id);
        }

        if ((member.shared_override === true) || (member.shared_override === false)) {
            collection.members_shared_override.push(member.id);
        }
    },

    /**
     * Apply post-processing to handle a possibly shared member being
     * removed from a collection.
     */
    sharedPostRemoveMemberFromCollectionNode : function (member, collection) {
        "use strict";

        // remove from shared members arrays, if it's there
        var i;

        if ((i = collection.members_shared.indexOf(member.id)) !== -1) {
            // Can't use indexOf as direct argument for splice,
            // as -1 (not found) will remove last element of the array
            collection.members_shared.splice(i, 1);
        }

        if ((i = collection.members_not_shared.indexOf(member.id)) !== -1) {
            collection.members_not_shared.splice(i, 1);
        }

        if ((i = collection.members_shared_override.indexOf(member.id)) !== -1) {
            collection.members_shared_override.splice(i, 1);
        }
    },

    /**
     * Re-calculate shared member counts for a collection.
     */
    _sharedPostRecalculateCollectionMembers : function (collection) {
        "use strict";

        // handle shared members in one sweep
        collection.members_shared = [];
        collection.members_not_shared = [];
        collection.members_shared_override = [];

        collection.members.forEach(function (member_id) {
            var node = this.nodes_map[member_id];

            if (!node) {
                return;
            }

            if (node.shared) {
                collection.members_shared.push(member_id);
            }
            else {
                collection.members_not_shared.push(member_id);
            }

            if (node.shared_override === true || node.shared_override === false) {
                collection.members_shared_override.push(member_id);
            }
        }, this);
    },

    /**
     * Mark pending shared overrides as saved after they have been
     * successfully saved.
     */
    _markPendingSharedOverridesAsSaved : function (saved_shared_overrides) {
        "use strict";

        var saved_ids = {};
        saved_shared_overrides.forEach(function(override) {
            saved_ids[override.id] = override.value;
        });
        
        this.shared_overrides.forEach(function (override) {
            if (override.id in saved_ids) {
                delete override.pending;
            }
        });
    },

    /**
     * Returns an array of currently pending shared overrides.
     *
     * @returns {Array}
     */
    getPendingSharedOverrides : function () {
        "use strict";

        return this.shared_overrides.filter(function (override) {
            return override.pending;
        });
    },


    /**
     * Returns true if there are pending rules or shared overrides.
     *
     * @returns {boolean}
     */
    hasPendingRules : function () {
        "use strict";

        return (this.getPendingRules().length > 0 ||
                this.getPendingSharedOverrides().length > 0);
    },

    
    /**
     * Create a pending update to the override value of the specified node.
     *
     * @param {Object} datum - Node data.
     * @param {(Boolean|Null)} new_value - New override value for the specified node.
     * @param {String[]} [node_ids] - if specified, the node IDs to use when
     *                                overriding. If not specified, defaults to
     *                                node ID for a non-collection node and all
     *                                member IDs for a collection.
     */
    _createPendingUpdateForSharedOverride : function (datum, new_value, node_ids) {
        "use strict";

        var is_collection = this.isCollectionNode && this.isCollectionNode(datum),
            new_overrides = [];

        if (node_ids === undefined) {
            if (is_collection) {
                node_ids = (new_value === null) ? datum.members_shared_override
                                                : datum.members;
            }
            else {
                node_ids = [datum.id];
            }
        }

        node_ids.forEach(function (node_id) {
            new_overrides.push({
                id          : node_id,
                description : is_collection ? datum.members_short_name[datum.members.indexOf(node_id)]
                                            : datum.short_name,
                value       : new_value,
                pending     : true
            });
        }, this);

        Array.prototype.push.apply(this.shared_overrides, new_overrides);

        this.updateSaveChangesButton();
        this.showSpinner();
        this.applyRules();

        if (this.pushEvent !== undefined) {
            this.pushEvent(this.EVENT_UPDATE_SHARED_OVERRIDES, {
                overrides    : new_overrides,
                override_ids : node_ids,
                undone       : false,
                undo         : bindContext(this, function(data) {
                    this._cancelPendingUpdateForSharedOverride(data.override_ids, true);
                    this._onRuleSaveDeleteCallback(true);
                    return true;
                }),
                undo_name    : bindContext(this, this._sharedUndoRedoName),
                redo         : bindContext(this, function(data) {
                    this._reCreatePendingUpdateForSharedOverride(data.overrides);
                    this._onRuleSaveDeleteCallback(true);
                    return true;
                }),
                redo_name    : bindContext(this, this._sharedUndoRedoName)
            });
        }
    },

    /**
     * Tell if there are pending updates to the override value of the given nodes.
     *
     * @param {Array} node_ids - List of node IDs to check.
     *
     * @returns {Boolean}
     */
    _sharedOverrideUpdatePendingForNode : function (node_ids) {
        "use strict";

        var pending_override_ids = arrayToSet(this.shared_overrides.map(function (o) {
            return o.id;
        }));

        return node_ids.every(function (id) {
            return id in pending_override_ids;
        });
    },

    /**
     * Cancel pending updates to shared overrides.
     *
     * @param {Array} override_ids_to_cancel - List of override IDs to cancel.
     * @param {Boolean} no_undo - If true, do not push an event to the event pump.
     */
    _cancelPendingUpdateForSharedOverride : function (override_ids_to_cancel, no_undo) {
        "use strict";

        var set_of_ids_to_cancel = arrayToSet(override_ids_to_cancel);

        var cancelled_overrides = this.shared_overrides.filter(function (o) {
            return o.id in set_of_ids_to_cancel;
        });

        this.shared_overrides = this.shared_overrides.filter(function (o) {
            return !(o.id in set_of_ids_to_cancel);
        });

        this.updateSaveChangesButton();
        this.showSpinner();
        this.applyRules();

        if (!no_undo && this.pushEvent !== undefined) {
            this.pushEvent(this.EVENT_CANCEL_UPDATE_SHARED_OVERRIDES, {
                overrides    : cancelled_overrides,
                override_ids : override_ids_to_cancel,
                undone       : false,
                undo         : bindContext(this, function(data) {
                    this._reCreatePendingUpdateForSharedOverride(data.overrides);
                    this._onRuleSaveDeleteCallback(true);
                    return true;
                }),
                undo_name    : bindContext(this, this._sharedUndoRedoName),
                redo         : bindContext(this, function(data) {
                    this._cancelPendingUpdateForSharedOverride(data.override_ids, true);
                    this._onRuleSaveDeleteCallback(true);
                    return true;
                }),
                redo_name    : bindContext(this, this._sharedUndoRedoName)
            });
        }
    },

    /**
     * Recreate pending shared overrides that were deleted using "Undo" action
     * or _cancelPendingUpdateForSharedOverride function.
     * This pushes overrides created before back to shared_overrides array.
     *
     * @param {Array} overrides_to_recreate
     */
    _reCreatePendingUpdateForSharedOverride : function (overrides_to_recreate) {
        "use strict";

        Array.prototype.push.apply(this.shared_overrides, overrides_to_recreate);
    },

    /**
     * Segment all shared overrides into three groups: pending_create,
     * pending_delete and saved.
     *
     * @returns {Object}
     */
    _segmentSharedOverrides: function() {
        "use strict";

        var segmented_overrides = {
            pending_create : {
                to_shared     : [],
                to_not_shared : []
            },
            pending_delete : [],
            saved          : []
        };

        this.shared_overrides.forEach(function(override) {
            if (override.pending) {
                if (override.value === null) {
                    segmented_overrides.pending_delete.push(override);
                }
                else if (override.value === true) {
                    segmented_overrides.pending_create.to_shared.push(override);
                }
                else if (override.value === false) {
                    segmented_overrides.pending_create.to_not_shared.push(override);
                }
            }
            else {
                segmented_overrides.saved.push(override);
            }
        });

        return segmented_overrides;
    },

    /**
     * Create a tooltip for undo/redo buttons (shared overrides operations).
     *
     * @param {Object} data - Data related to the event.
     *
     * @returns {String}
     */
    _sharedUndoRedoName : function (data) {
        "use strict";

        var count = data.overrides.length,
            op;

        if (data.event === this.EVENT_UPDATE_SHARED_OVERRIDES) {
            op = "change to shared setting of ";
        }
        else if (data.event === this.EVENT_CANCEL_UPDATE_SHARED_OVERRIDES) {
            op = "cancellation of change to shared setting of ";
        }

        return op + (count === 1 ? data.overrides[0].description
                                 : count + " nodes");
    }
});

/* global d3, bindContext, TWClass */
/* jshint sub: true, nonew: false, scripturl: true */

// Inline visualization

if (tw === undefined) {
    var tw = {};
}
if (tw.viz === undefined) {
    tw.viz = {};
}

// Mixin for notes support.
//
tw.viz.NotesMixIn = TWClass.create({

    // Length to word wrap
    NOTE_TEXT_LENGTH       : 200,

    // Transition times
    NOTE_RESIZE_TRANSITION : 250,

    // Sticky-notes
    notes      : undefined,
    note_count : 0,

    // Control object
    note_drag : undefined,

    // DOM objects
    note_edit_div   : undefined,
    note_edit_input : undefined,

    // Group and a selection of it
    notes_group : undefined,
    note_sel    : undefined,

    initNotes : function () {
        this.notes = [];
    },

    addNotesContextMenuItems : function () {
        "use strict";

        // Add to common menus

        this.CONTEXT_MENU_ITEMS["background"] =
            this.CONTEXT_MENU_ITEMS["background"].concat([
                null,
                [ "Add note", true, bindContext(this, this.addNote) ]
            ]);

        this.CONTEXT_MENU_ITEMS["node"] =
            this.CONTEXT_MENU_ITEMS["node"].concat([
                null,
                [ "Add note", true, bindContext(this, this.addNote) ]
            ]);

        this.CONTEXT_MENU_ITEMS["link"] =
            this.CONTEXT_MENU_ITEMS["link"].concat([
                [ "Add note", true, bindContext(this, this.addNote) ]
            ]);

        // Create special menu for notes

        this.CONTEXT_MENU_ITEMS["note"] = [
            [ "Edit note",   true, bindContext(this, this.editNote)   ],
            [ "Resize note", true, bindContext(this, this.resizeNote) ],
            [ "Delete note", true, bindContext(this, this.deleteNote) ],
        ];
    },

    _getNotesContextMenuSelection : function (datum) {
        "use strict";

        if (datum.note) {
            return {
                items       : this.note_sel,
                target_kind : "note"
            };
        }

        return { items: undefined, target_kind: undefined };
    },

    _initNotesControlObjects : function () {
        "use strict";

        var objref = this;

        this.note_drag = d3.behavior.drag()
            .origin(function(d) { return d; })
            .on("drag", function(d) {
                d.x = d3.event.x;
                d.y = d3.event.y;
                d3.select(this).attr("transform", objref.transformNote(d));
            })
            .on("dragstart", function () {
                d3.event.sourceEvent.stopPropagation();
            });
    },

    _initNotesGroupObjects : function () {
        "use strict";

        this.notes_group = this.container
            .append("g")
            .attr("class", "stickynote");
    },

    _constructNotesElements : function () {
        "use strict";

        //
        // Note editor

        this.note_edit_div = this.viz_container.append("div")
            .attr("class", "actionDropdownMenu")
            .attr("id", "inlineVizNoteEdit")
            .attr("style", "display:none");

        this.note_edit_input = this.note_edit_div
            .append("input")
            .attr("type", "text")
            .attr("size", "50")
            .attr("id", "inlineVizNoteEditInput");

    },

    _setNotesTransformAttr : function () {
        "use strict";

        this.note_sel.attr("transform", this.transformNote);
    },

    layoutTransitionNotes : function (do_zoom, callback, ender) {
        "use strict";

        this.note_sel.transition().duration(this.LAYOUT_TRANSITION)
            .attr("transform", this.transformNote)
            .call(ender);
    },

    transformNote : function (d) {
        "use strict";

        var x = d.x, y = d.y;

        if (d.node) {
            x += d.node.x;
            y += d.node.y;
        }
        else if (d.link) {
            x += (d.link.source.x + d.link.target.x) / 2;
            y += (d.link.source.y + d.link.target.y) / 2;
        }
        return "translate(" + x + "," + y + ") scale(" + (d.zoom || 1) + ")";
    },

    updateNotes : function (initial, ender) {
        "use strict";

        var note_dat = this.notes_group.selectAll("g")
                .data(this.notes, function(d) { return d.id; }),
            objref = this;

        var note_add = note_dat
            .enter()
            .append("g")
            .on("dblclick", function(d) {
                var top_position    = d3.mouse(objref.svg.node());
                var scaled_position = d3.mouse(objref.container.node());
                objref.editNote(d, d3.select(this),
                              top_position, scaled_position);
            })
            .call(this.note_drag);

        if (!initial) {
            note_add.style("opacity", 0);
        }

        note_add
            .append("rect")
            .attr("class", "stickynote")
            .attr("x", -5)
            .attr("y", -5)
            .attr("rx", 5)
            .attr("ry", 5);

        note_add
            .append("text")
            .attr("class", "stickynote")
            .attr("dy", "1em");

        this.notes_group.selectAll("g")
            .attr("transform", this.transformNote)
            .each(function(d) {
                var g = d3.select(this);
                var r = g.select("rect");
                var t = g.select("text");

                t.text(d.note);

                if (t.node().getComputedTextLength() > objref.NOTE_TEXT_LENGTH)
                    objref.wrapText(t, objref.NOTE_TEXT_LENGTH);

                var bb = t.node().getBBox();
                r.attr("width", bb.width+10).attr("height", bb.height+10);
            });

        if (!initial) {
            note_add
                .transition().duration(this.FADE_TRANSITION).style("opacity", 1)
                .call(ender);
        }

        note_dat
            .exit()
            .transition().duration(this.FADE_TRANSITION).style("opacity", 0)
            .call(ender, true);

        this.note_sel = this.notes_group.selectAll("g");
    },

    // Add or edit an existing note.
    //
    // d               : the data item for the node or link clicked upon
    // note            : d3 selection of the click target
    // top_position    : coordinates relative to the top element
    // scaled_position : coordinates relative to the scaled svg
    // edit            : true if editing an existing note; false if a new one
    //
    addOrEditNote : function (d, note, top_position, scaled_position, edit) {
        "use strict";

        this.keyboard_input = true;

        if (edit) {
            this.note_edit_input.property("value", d.note);
        }
        else {
            this.note_edit_input.property("value", "");
        }

        this.note_edit_div
            .style("left", top_position[0] + "px")
            .style("top", top_position[1] + "px")
            .style("display", "inline-block");

        this.note_edit_input.node().focus();

        this.note_edit_input
            .on("keypress", bindContext(this, function() {
                if (d3.event.keyCode == 13) {
                    this.keyboard_input = false;
                    this.note_edit_input.on("keypress", null);
                    this.note_edit_input.on("blur", null);
                    this.note_edit_div.style("display", "none");
                    d3.event.preventDefault();

                    var note_text = this.note_edit_input.property("value");

                    if (edit) {
                        if (note_text) {
                            this._handleNoteEdit(d);
                            d.note = note_text;
                        }
                        else {
                            this.deleteNote(d);
                            return;
                        }
                    }
                    else {
                        if (!note_text)
                            return;

                        this._handleNotesChange("addNote");

                        var new_note = {
                            id   : this.note_count++,
                            x    : scaled_position[0],
                            y    : scaled_position[1],
                            zoom : 1 / this.zoom.scale(),
                            note : note_text,
                        };

                        if (d) {
                            if (d.short_name) {
                                // Note on a node
                                new_note.node = d;
                                new_note.x -= d.x;
                                new_note.y -= d.y;
                            }
                            else if (d.target) {
                                // Note on a link
                                new_note.link = d;
                                new_note.x -= (d.source.x + d.target.x) / 2;
                                new_note.y -= (d.source.y + d.target.y) / 2;
                            }
                        }
                        this.notes.push(new_note);
                    }

                    this.updateNotes(false, this.endallMulti("addNote"));
                }
            }))
            .on("blur", bindContext(this, function() {
                this.keyboard_input = false;
                this.note_edit_input.on("keypress", null);
                this.note_edit_input.on("blur", null);
                this.note_edit_div.style("display", "none");
            }));
    },

    addNote : function (d, note, top_position, scaled_position) {
        "use strict";
        this.addOrEditNote(d, note, top_position, scaled_position, false);
    },

    editNote : function (d, note, top_position, scaled_position) {
        "use strict";

        this.addOrEditNote(d, note, top_position, scaled_position, true);
    },

    deleteNote : function (d) {
        "use strict";

        this._handleNotesChange("deleteNote");

        for (var idx=0; idx != this.notes.length; idx++) {
            if (this.notes[idx].id === d.id) {
                this.notes.splice(idx, 1);
                break;
            }
        }
        this.updateNotes(false, this.endallMulti("deleteNote"));
    },

    resizeNote : function (d, note) {
        "use strict";

        d.zoom = 1 / this.zoom.scale();

        note.transition().duration(this.NOTE_RESIZE_TRANSITION)
            .attr("transform", this.transformNote);
    },

    // Push undo/redo event to event pump after note has been added or deleted
    //
    _handleNotesChange : function (e, d) {
        "use strict";

        if (!this.pushEvent) {
            return ;
        }

        var event_map = {
                addNote    : this.EVENT_NOTE_ADD,
                deleteNote : this.EVENT_NOTE_DELETE
            };

        this.pushEvent(event_map[e], {
            undone       : false,
            old_notes    : this.notes.clone(),
            redo_notes   : undefined,
            changed_note : Object.clone(d),
            undo : function (data) {
                data.redo_notes = this.notes;
                this.notes = data.old_notes;
                this.updateNotes(false, this.endallMulti(e));
                return true;
            },
            redo : function(data) {
                if (data.redo_notes === undefined) {
                    console.warn("Internal Error: Redo notes is undefined");
                    return false;
                }
                this.notes = data.redo_notes;
                this.updateNotes(false, this.endallMulti());
                return true;
            }
        });
    },

    // Push undo/redo event to event pump after note has been edited
    //
    _handleNoteEdit : function (d) {
        "use strict";

        if (!this.pushEvent) {
            return ;
        }

        this.pushEvent(this.EVENT_NOTE_EDIT, {
            undone    : false,
            note_id   : d.id,
            undo_note : d.note,
            redo_note : undefined,
            undo : function (data) {
                var d = this.notes.find(function(n) {
                    return n.id === data.note_id;
                });
                data.redo_note = d.note;
                d.note = data.undo_note;
                this.updateNotes(false, this.endallMulti());
                return true;
            },
            redo : function(data) {
                if (data.redo_note === undefined) {
                    console.warn("Internal Error: Redo note is undefined");
                    return false;
                }
                var d = this.notes.find(function(n) {
                    return n.id === data.note_id;
                });
                d.note = data.redo_note;
                this.updateNotes(false, this.endallMulti());
                return true;
            }
        });
    },

    // State persistence
    //

    addNotesVizState : function (state) {
        "use strict";

        if (this.notes.length > 0) {
            state.notes = [];

            this.notes.forEach(function (n) {
                var anchorType = "none";
                var anchor_data = {};

                if (n.node !== undefined) {
                    anchorType          = "node";

                    anchor_data.node_id  = n.node.id;
                }
                else if (n.link !== undefined) {
                    anchorType              = "link";

                    anchor_data.link_tgt_id  = n.link.tgt_id;
                    anchor_data.link_src_id  = n.link.src_id;
                    anchor_data.link_kind    = n.link.kind;
                }

                anchor_data.type = anchorType;

                var to_add = {
                    text        : n.note,

                    extra_data  : {
                        x       : n.x,
                        y       : n.y,
                        zoom    : n.zoom,
                        anchor  : anchor_data
                    }
                };

                state.notes.push(to_add);
            }, this);
        }
    },

    setNotesVizState : function (data) {
        "use strict";

        if (data.notes !== undefined) {

            data.notes.forEach(function (note_state) {
                var note       = {};
                var extra_data = note_state.extra_data;
                var valid      = true;

                if (extra_data === undefined) {
                    return;
                }

                note.id     = this.note_count++;
                note.note   = note_state.text;
                note.x      = extra_data.x;
                note.y      = extra_data.y;
                note.zoom   = extra_data.zoom;

                var anchor_data = extra_data.anchor;

                if (anchor_data.type === "node") {
                    var node = this.nodes_map[anchor_data.node_id];
                    note.node = node;
                }
                else if (anchor_data.type === "link") {
                    var matching_links = this.all_links.filter(function (link) {
                        return (
                            link.tgt_id     === anchor_data.link_tgt_id &&
                            link.src_id  === anchor_data.link_src_id &&
                            link.kind    === anchor_data.link_kind
                        );
                    });

                    if (matching_links.length !== 1) {
                        // impossible to tell which link to choose
                        // TODO does this really need such assertion?
                        return;
                    }

                    note.link = matching_links[0];
                }
                else if (anchor_data.type === "none") {
                    // valid note, no anchor
                }
                else {
                    valid = false;
                }

                if (valid) {
                    this.notes.push(note);
                }

            }, this);

            this.updateNotes(false, this.endallMulti("addNote"));
        }
    }
});

/* global d3, bindContext, TWClass */
/* jshint sub: true, nonew: false, scripturl: true */

// Inline visualization

if (tw === undefined) {
    var tw = {};
}
if (tw.viz === undefined) {
    tw.viz = {};
}

// Mixin for highlighting nodes
//
tw.viz.HighlightMixIn = TWClass.create({

    highlight_color_num : 9,

    highlight_node_sets : undefined,

    initHighlighting : function () {
        "use strict";
        this.highlight_node_sets = {};
    },

    addHighlightingContextMenuItems : function () {
        "use strict";

        this.CONTEXT_MENU_ITEMS["node"] =
            this.CONTEXT_MENU_ITEMS["node"].concat([
                null,
                [
                    bindContext(this, function (datum, target) {
                        if (datum.highlight_set === undefined) {
                            // Don't activate if node is not in a highlighted set
                            return ;
                        }

                        // Check if we can lookup a short name
                        var cn = this.nodes_map[datum.highlight_set];
                        cn = cn !== undefined ? cn["short_name"]
                                              : datum.highlight_set;

                        if (target.select("circle, rect")
                                .classed("highlighted")) {
                            return "Hide highlighting of " + cn;
                        }
                        else {
                            return "Highlight " + cn;
                        }
                    }),
                    bindContext(this, function (datum, target) {
                        return datum.highlight_set !== undefined;
                    }),
                    bindContext(this, this._handleHighlightContextMenuAction)
                ],
                [
                    function (datum) {
                        if (datum.highlight_set !== undefined) {
                            return "Hide all highlighting";
                        }
                    },
                    bindContext(this, function () {
                        var highlighted = this.node_sel.select("circle, rect")
                            .filter(".highlighted");
                        return !highlighted.empty();
                    }),
                    bindContext(this, this.clearHighlighting)
                ]
            ]);

        this.CONTEXT_MENU_ITEMS["background"] =
            this.CONTEXT_MENU_ITEMS["background"].concat([
                null
            ]);
    },

    // Handle if the user does a highlight action from the context menu.
    //
    _handleHighlightContextMenuAction : function (datum, target) {
        "use strict";
        var set_name    = datum.highlight_set,
            highlighted = target.select("circle, rect").classed("highlighted"),
            objref      = this;

        if (set_name !== undefined) {
            this.node_sel.each(function (d) {
                if (d.highlight_set === set_name) {
                    objref.highlightNode(this, set_name, !highlighted);
                }
            });
        }
    },

    // Highlight a single node.
    //
    // node      - Single or a list of dom elements which should be highlighted.
    // set_name  - Name to use for the group.
    // highlight - Flag to indicate if the highlight color should be
    //             added or removed.
    //
    highlightNode : function (node, set_name, highlight) {
        "use strict";

        var hc = this._getHighlightColor(set_name),
            ns = d3.select(node);

        ns.select("circle, rect")
            .classed("highlighted", highlight)
            .classed("color-" + hc, highlight);
        if (set_name !== undefined) {
            ns.datum().highlight_set = set_name;
        }
    },

    // Clear all highlighting.
    // Does not clear "review suggested" highlighting - see below for more info.
    //
    clearHighlighting : function () {
        "use strict";

        var objref = this;
        this.node_sel.each(function (d) {
            objref.highlightNode(this, undefined, false);
        }, this);
    },

    _getHighlightColor : function (set_name) {
        "use strict";
        var color = this.highlight_node_sets[set_name];

        if (color === undefined) {
            this.highlight_node_sets[set_name] = color = this.highlight_color_num;

            this.highlight_color_num = (this.highlight_color_num + 1) % 9;
        }

        return color;
    },

    //
    // "Review suggested" highlighting
    //

    // Highlight a single node that is suggested for review / needing attention.
    // Such a highlight is completely separate from other highlights and is
    // "sticky". There's no other way of removing it, but calling
    // clearReviewSuggestedHighlighting.
    //
    // node      - Single or a list of DOM elements which should be highlighted.
    // highlight - Flag to indicate if the highlight should be added or removed.
    //
    highlightReviewSuggestedNode : function (node, highlight) {
        "use strict";

        var ns = d3.select(node);

        ns.select("circle, rect")
            .classed("review-suggested", highlight);
    },

    // Clear all highlighting for "review suggested".
    //
    // Additionally, modifies the nodes' states to indicate that review
    // is no longer suggested.
    //
    clearReviewSuggestedHighlighting : function () {
        "use strict";

        var objref = this;

        this.node_sel.each(function (d) {
            var datum = d3.select(d);
            datum.review_suggested = false;

            objref.highlightReviewSuggestedNode(this, false);
        });
    }
});

/* global arrayToSet, bindContext, copyObject, d3, mergeObjects, TWClass */
/* jshint sub: true, nonew: false, scripturl: true */

// Inline visualization namespace

if (tw === undefined) {
    var tw = {};
}
if (tw.viz === undefined) {
    tw.viz = {};
}

// MixIn for extending the model from a selected node which we call as "extended root node". 
// It gets data from backend via AjaxInlineVisualization and the data has the following format. 
//      
//    {
//       nodes      : {...}, // Node states including suppressed ones
//       links      : [...], // Relationship states
//       suppressed : [...]  // IDs of nodes that should have been suppressed
//    },
//
// Once the data is obtained, it is filtered so that it contains nodes and links that
// are relevant for extended root nodes. The filtered data is then cached in the 
// visualization object so that same data does not have to be reloaded.
//
tw.viz.ExtendModelMixIn = TWClass.create({

    // Contains related node data loaded from backend for a set of extended root nodes.
    _related_nodes_cache : {},

    // Message to be shown when there are no more new related nodes from an extended root node.
    //_NO_NEW_NODE_MSG     : labels.NoMoreRelatedNodes,

    // Categories of new related nodes and their related configurations.
    NODE_CATEGORIES      : undefined,

    // Initializes the MixIn.
    //
    initExtendModelMixIn : function () {
        "use strict";

        // Check dependency to collection MixIn.
        if (this.isCollectionNode === undefined) {
            throw Error("Missing JS Dependency: Model Extension requires Collection component.");
        }

        this._related_nodes_cache = {};

        var show_more_icon_normal       = this.options.images.extend_new_normal,
            show_removed_icon_normal    = this.options.images.extend_removed_normal,
            show_suppressed_icon_normal = this.options.images.extend_suppressed_normal,
            show_more_icon_hot          = this.options.images.extend_new_hot,
            show_removed_icon_hot       = this.options.images.extend_removed_hot,
            show_suppressed_icon_hot    = this.options.images.extend_suppressed_hot;

        // node_getter_func represents the function to filter out relevant category
        // from all related nodes of an extended root node, whereas count_func is 
        // the function that calculates the count to show for each category in UI.

        this.NODE_CATEGORIES = [
            {
                "label"            : "Show more related nodes.",
                "icon_normal"      : show_more_icon_normal,
                "icon_hot"         : show_more_icon_hot,
                "id"               : "show_more_icon_holder",
                "node_getter_func" : bindContext(this, this.getNewNodesAndLinks),
                "count_func"       : bindContext(this, this._countLinks)
            },
            {
                "label"            : "Show nodes that were suppressed.",
                "icon_normal"      : show_suppressed_icon_normal,
                "icon_hot"         : show_suppressed_icon_hot,
                "id"               : "show_suppressed_icon_holder",
                "node_getter_func" : bindContext(this, this.getSuppressedNodesAndLinks),
                "count_func"       : bindContext(this, this._countLinks)
            },
            {
                "label"            : "Show currently removed nodes.",
                "icon_normal"      : show_removed_icon_normal,
                "icon_hot"         : show_removed_icon_hot,
                "id"               : "show_removed_icon_holder",
                "node_getter_func" : bindContext(this, this.getCurrentlyRemovedNodesAndLinks),
                "count_func"       : bindContext(this, this._countNodes)
            }
        ];
    },

    // Adds an icon bar in the context menu, containing buttons for three categories 
    // of related nodes. Number of nodes for each category will be loaded and shown 
    // asynchronously.
    //
    addExtendModelMenuItems : function () {
        "use strict";

        this.CONTEXT_MENU_ITEMS["node"] = 
            this.CONTEXT_MENU_ITEMS["node"];/* .concat(
                bindContext(this, function (datum, target) {

                    // Show only when the right-click is on a node.
                    if (!datum) return;

                    // Insert the icon bar as a first row.
                    var icon_holder = this.context_menu_items
                        .insert("div", ":first-child")
                        .classed("extend-icons-holder", true);

                    // Construct HTML elements for the three categories.
                    this._constructExtendModelCategories(datum, target, icon_holder);

                    // Show node counts for each category. Perform the count for each category 
                    // sequentially so that data obtained from the very first request can be reused 
                    // instead of sending AJAX requests to backend for each category.

                    var loadCategorySequentially = bindContext(this, function (array, i) {
                        if (i >= array.length) {
                            // Remove the "+" sign if appropriate after loading data for all categories.
                            this._removeExtendButtonWhenAppropriate(datum, target);
                            return;
                        }
                        
                        var node_category = array[i];
                        node_category.node_getter_func(datum, 
                            bindContext(this, function (nodes_data) {
                                icon_holder
                                    .select("#" + node_category.id)
                                    .select("span")
                                    .text("" + node_category.count_func(datum, nodes_data));
                                
                                // Do the loading for next category.
                                loadCategorySequentially(array, i+1);
                            }));
                    });

                    loadCategorySequentially(this.NODE_CATEGORIES, 0);
                })
            );*/
    },

    // Picks nodes and links that are related to the given node and are new to the
    // visualization.
    //
    // datum              - Extended root node data (could be either a standalone or a collection),
    // filtered_resp_data - Data set to pick from.
    //
    _pickNewNodesAndLinks : function (datum, filtered_resp_data) {
        "use strict";

        // This function assumes that all collections in the filtered_resp_data
        // do not have any members that are already available in existing data
        // to avoid conflicts among collection members.

        // Nodes in the completely_new variable may contain nodes that already exist
        // in the current visualization (e.g. Undoing of extend model action means
        // removing all nodes conceptually but they are not actually removed due to
        // the layout limitation)

        var completely_new = {
                nodes: {},
                links: []
            },
            coll_members            = {},
            suppressed_node_ids     = arrayToSet(filtered_resp_data.suppressed),
            ext_root_nodes          = this._getExtendedRootNodes(datum),
            suppressedMemberExist   = function (node) {
                return node.members.some(function (m) {
                    return suppressed_node_ids[m] !== undefined;
                });
            },

            // Get "completely new" nodes from newly-requested data.

            new_qualified_neighbors = this._getQualifiedNeighbours(
                datum, filtered_resp_data.nodes, filtered_resp_data.links,
                bindContext(this, function (node) {

                    // We have to check if the node is completely new and is NOT
                    // mentioned in suppressed node IDs returned from backend.

                    return (this._isNewToViz(node) && !suppressed_node_ids[node.id]);

                })
            ),

            // Get "completely new" nodes from existing data.

            existing_qualified_neighbors = this._getQualifiedNeighbours(
                datum, this.nodes_map, this.all_links, bindContext(this, function (node) {

                    if (this.isCollectionNode(node) && (!this.collectionMembersLoaded(node) ||
                        (this.collectionMembersLoaded(node) && !node.expanded))) {

                        // The node to be examined is a collection node that satisfies either of
                        // the following conditions:
                        //    - Members are not available in current visualization, or
                        //    - Members are available in current visualization and the collection
                        //      is currently collapsed.
                        //
                        // We have to check if the node is currently flagged deleted and all of
                        // its members are NOT mentioned in suppressed node IDs returned from
                        // backend.

                        return (this._isMarkedDeleted(node) && !suppressedMemberExist(node));

                    }
                    else {

                        // The node to be examined is a standalone node.
                        //
                        // We have to check if the node is currently flagged deleted and is NOT
                        // mentioned in suppressed node IDs returned from backend.

                        return (this._isMarkedDeleted(node) && !suppressed_node_ids[node.id]);

                    }
                })
            );

        // Merge the relevant existing and new nodes.
        completely_new.nodes = mergeObjects(new_qualified_neighbors, existing_qualified_neighbors);
        coll_members         = this._getMemberToCollectionMappings(completely_new, true);

        // Get all associated links.
        var have_seen = {};
        filtered_resp_data.links.forEach(bindContext(this, function (link) {
            var link_id  = this._buildLinkId(link.src_id, link.tgt_id),
                node_ids = [link.src_id, link.tgt_id, coll_members[link.src_id], coll_members[link.tgt_id]],
                link_is_relevant = (
                    node_ids.some(function (node_id) {
                        return (
                            completely_new.nodes[node_id] !== undefined ||
                            ext_root_nodes[node_id] !== undefined
                        );
                    }) &&
                    node_ids.every(function (node_id) {
                        return suppressed_node_ids[node_id] === undefined;
                    })
                );

            if (link_is_relevant && have_seen[link_id] === undefined) {
                var the_link = this._getExistingLinkIfAvailable(link);
                if (this.links_map[link_id] === undefined || this._isMarkedDeleted(the_link)) {
                    completely_new.links.push(the_link);
                }
                have_seen[link_id] = true;
            }
        }));

        return completely_new;
    },

    // Picks nodes and links that are related to the given node and are currently suppressed.
    //
    // datum              - Extended root node data (could be either a standalone or a collection),
    // filtered_resp_data - Data set to pick from.
    //
    _pickSuppressedNodesAndLinks : function (datum, filtered_resp_data) {
        "use strict";

        // This function assumes that all suppressed nodes in filtered_resp_data
        // are non-collections because backend ensures suppressed nodes are
        // standalone.

        var suppressed = {
                nodes: {},
                links: []
            },
            suppressed_node_ids     = arrayToSet(filtered_resp_data.suppressed),
            suppressedMemberExist   = function (node) {
                return node.members.some(function (m) {
                    return suppressed_node_ids[m] !== undefined;
                });
            },

            // Get suppressed nodes from newly-requested data.

            new_qualified_neighbors = this._getQualifiedNeighbours(
                datum, filtered_resp_data.nodes, filtered_resp_data.links, bindContext(this, function (node) {

                    // We have to check if the node is completely new and is mentioned
                    // in suppressed node IDs returned from backend.

                    return (this._isNewToViz(node) && suppressed_node_ids[node.id]);

                })
            ),

            // Get suppressed nodes from existing data.

            existing_qualified_neighbors = this._getQualifiedNeighbours(
                datum, this.nodes_map, this.all_links, bindContext(this, function (node) {

                    if (this.isCollectionNode(node) && (!this.collectionMembersLoaded(node) ||
                        (this.collectionMembersLoaded(node) && !node.expanded))) {

                        // The node to be examined is a collection node that satisfies either of
                        // the following conditions:
                        //    - Members are not available in current visualization, or
                        //    - Members are available in current visualization and the collection
                        //      is currently collapsed.
                        //
                        // We have to check if the node is currently flagged deleted and one of its
                        // member is mentioned in suppressed node IDs returned from backend.

                        return (this._isMarkedDeleted(node) && suppressedMemberExist(node));
                    }
                    else {

                        // The node to be examined is a standalone node.
                        //
                        // We have to check if the node is currently flagged hidden and is mentioned
                        // in suppressed node IDs returned from backend.

                        return (suppressed_node_ids[node.id] && this._isMarkedDeleted(node));
                    }
                })
            );

        // Merge the relevant existing and new nodes.
        suppressed.nodes = mergeObjects(new_qualified_neighbors, existing_qualified_neighbors);

        // Get all associated links.
        var have_seen = {};
        filtered_resp_data.links.concat(this.all_links).forEach(bindContext(this, function (link) {
            var link_id  = this._buildLinkId(link.src_id, link.tgt_id),
                node_ids = [link.src_id, link.tgt_id, this.collection_members[link.src_id],
                    this.collection_members[link.tgt_id]],
                link_is_relevant = node_ids.some(function (node_id) {
                    return suppressed.nodes[node_id] !== undefined;
                });

            if (link_is_relevant && have_seen[link_id] === undefined) {
                suppressed.links.push(this._getExistingLinkIfAvailable(link));
                have_seen[link_id] = true;
            }
        }));

        return suppressed;
    },

    // Gets nodes and links that are related to the given node and are new to the 
    // visualization.
    //
    // datum    - Extended root node data (could be either a standalone or a collection),
    // callback - Function to process once the requested data is available.
    //
    getNewNodesAndLinks : function (datum, callback) {
        "use strict";

        this._performActionOnRelatedNodesData(datum,
            bindContext(this, function (filtered_resp_data) {
                // Perform provided action on the chosen data.
                callback(this._pickNewNodesAndLinks(datum, filtered_resp_data));
            }));
    },

    // Gets nodes and links that are related to the given node and are currently suppressed.
    //
    // datum    - Extended root node data (could be either a standalone or a collection),
    // callback - Function to process once the requested data is available.
    //
    getSuppressedNodesAndLinks : function (datum, callback) {
        "use strict";

        this._performActionOnRelatedNodesData(datum,
            bindContext(this, function (filtered_resp_data) {
                // Perform provided action on the chosen data.
                callback(this._pickSuppressedNodesAndLinks(datum, filtered_resp_data));
            }));
    },

    // Gets nodes and links that are related to the given node, both new and suppressed.
    //
    // datum    - Extended root node data (could be either a standalone or a collection),
    // callback - Function to process once the requested data is available.
    //
    getNewAndSuppressedNodesAndLinks : function (datum, callback) {
        "use strict";

        this._performActionOnRelatedNodesData(datum,
            bindContext(this, function (filtered_resp_data) {

                var new_data        = this._pickNewNodesAndLinks(datum, filtered_resp_data),
                    suppressed_data = this._pickSuppressedNodesAndLinks(datum, filtered_resp_data),
                    merged_data     = {
                        nodes : mergeObjects(new_data.nodes, suppressed_data.nodes),
                        links : new_data.links.concat(suppressed_data.links)
                    };

                // Perform provided action on the chosen data.
                callback(merged_data);
            }));
    },

    // Gets nodes and links that are related to the given node and are currently removed 
    // from the visualization. Does not rely on data from backend since the results
    // can be worked out in frontend immediately.
    //
    // datum    - Extended root node data (could be either a standalone or a collection),
    // callback - Function to process once the requested data is available.
    //
    getCurrentlyRemovedNodesAndLinks : function (datum, callback) {
        "use strict";

        // For currently removed nodes and links, we can calculate directly from existing data.

        var currently_removed = {
                nodes: this._getQualifiedNeighbours(datum, 
                    mergeObjects(this.nodes_map, this.removed_nodes), 
                    this.all_links, function (node) {
                        return (node.removed === true);
                    }
                ),
                links: []
            };

        // Get all associated links.
        this.all_links.forEach(bindContext(this, function (link) {
            if ((link.src_id === datum.id || link.tgt_id === datum.id) && link.removed) {
                currently_removed.links.push(link);
            }
        }));

        // Perform provided action on the chosen data.
        callback(currently_removed);
    },

    // Extends the given node with new or currently-removed nodes. The choice of which node 
    // category to be extended is determined by the node_getter_func which has to be one of
    // the following methods (getNewNodesAndLinks, getSuppressedNodesAndLinks,
    // getNewAndSuppressedNodesAndLinks or getCurrentlyRemovedNodesAndLinks).
    //
    // datum            - Extended root node data (could be either a standalone or a collection),
    // target           - SVG element that represents the node data,
    // node_getter_func - (Optional) Function to obtain nodes for the extension. If it is not
    //                    provided, getNewNodesAndLinks function will be used as a default,
    // post_extend_func - (Optional) Function to be executed after adding new node,
    // no_new_node_func - (Optional) Function to be executed if there are no nodes to be added.
    // 
    extendModel : function (datum, target, node_getter_func, post_extend_func, no_new_node_func) {
        "use strict";

        node_getter_func = node_getter_func || bindContext(this, this.getNewNodesAndLinks);

        var spinner;
        if (target) {
            spinner = target.append("svg:image")
                .attr("class", "circle")
                .attr("xlink:href", this.options.images.loading_icon)
                .attr("width", "16px")
                .attr("height", "16px")
                .attr("x", datum.node_icon_width/2 + 2);
        }

        var ui_cleanup = bindContext(this, function () {
                if (target === undefined) return;
                spinner.remove();
                this._removeExtendButtonWhenAppropriate(datum, target);
                this.updateSideBarMenu();
            }),
            mod_post_extend_func = bindContext(this, function () {
                if (post_extend_func) {
                    post_extend_func();
                }
                ui_cleanup();
            }),
            mod_no_new_node_func = bindContext(this, function () {
                if (no_new_node_func) {
                    no_new_node_func();
                }
                ui_cleanup();
            });

        node_getter_func(datum, bindContext(this, function (nodes_data) {

            // Since we consider all adjacent edges as new data, there may be a case where no new nodes
            // but new links exist for a given extended root node, and thus, we should consider for both cases.
            if (this._countNodes(datum, nodes_data) > 0 || this._countLinks(datum, nodes_data) > 0) {

                // If the nodes to be extended are supposed to be in existing data, we will treat 
                // them as removed nodes and call the appropriate function to restore them. 

                var existing_nids = d3.keys(nodes_data.nodes).filter(bindContext(this, function (node_id) {
                    if (this._isNewToViz(nodes_data.nodes[node_id])) {
                        return false;
                    }
                    else {

                        // If a node is found in one of the internal data structure but is currently flagged
                        // by Exclusion Rules, we can assume as if they do not exist in visualization. 

                        if ((this.nodes_map[node_id] && !this._isMarkedDeleted(this.nodes_map[node_id])) || 
                            (this.removed_nodes[node_id] && !this._isMarkedDeleted(this.removed_nodes[node_id]))) {
                            return true;
                        }

                    }
                }));

                if (existing_nids.length === 0) {
                    this._addMoreNodesToModel(datum, target, nodes_data, mod_post_extend_func);
                }
                else if (existing_nids.length === d3.keys(nodes_data.nodes).length) {
                    this._restoreImmediateRemovedNodes(nodes_data, mod_post_extend_func);
                }
                else {
                    throw Error("All nodes should be either new or currently removed.");
                }
            }
            else {
                mod_no_new_node_func();
            }
        }));
    },

    // Resets the cache about related nodes. Should be called when there is an action that changes 
    // state of the world since an initial page load.
    //
    invalidateRelatedNodesCache : function () {
        "use strict";
        
        this._related_nodes_cache = {};
    },

    // Constructs a "+" sign for each node in the visualization. If
    // the node is believed to have some non-displayed
    // edge_neighbours, the + is shown by default; otherwise it only
    // appears when the node is mouse-hovered. If the node is certain
    // to have no more new nodes, the sign will not be created.
    //
    // datum  - Extended root node data (could be either a standalone or
    //          a collection),
    // target - SVG element that represents the node data.
    //
    _constructExtendButtonForEachNode : function (datum, target) {
        "use strict";

        var scale = 0.5;
        //don't add ("+") for root node
        if(datum.root)
            return;
        // Plus sign ("+") next to each node.
        var t = target.append("text")
            .attr("x", 25 - datum.node_icon_width/2)
            .attr("y", -6)
            .attr("text-anchor", "end")
            .attr("class", "nodeRunDiscovery")
            .style("display", "none")
            .text("+");

        t.on("mouseenter", function () {
            // Because we position "+" based on node width, we need some generic
            // mechanism of scaling, as this happens relatively to 0,0
            // So we firstly move it to 0,0, then scale, then put back.
            //
            var box = this.getBBox(),
                tx = box.x + box.width/ 2,
                ty = box.y + box.height/2,
                s = 2*(scale + 1);

            t.transition()
                .duration(500)
                .ease("elastic")
                .attr("transform",
                "translate(" + tx + ", " + ty + ") scale(" + s + ") " +
                "translate(" + (-tx +2) + ", " + (-ty - 1) + ")");
        });
        t.on("mouseout", function () {
            if (!t.node().removing) {
                t.transition()
                    .duration(100)
                    .attr("transform", "");
            }
        });
        t.on("click", bindContext(this, function () {
            d3.event.preventDefault();
            d3.event.stopPropagation();

            autocloser.forceClose(); // Need to close active sidebar menu item

            this.extendModel(datum, target,
                bindContext(this, this.getNewAndSuppressedNodesAndLinks),
                undefined,
                bindContext(this, this._showEphemeralMessageForNode, 
                    datum, target, labels.NoMoreRelatedNodes));

            t.node().removing = true;
            t.transition()
                .attr("transform", "")
                .duration(1000)
                .style("opacity", 0);
        }));

        // If node has edge_neighbours always show the sign.
        // Otherwise, show it only on mouse hover.
        // Hovering above the "+" sign is quite difficult, so a little delay
        // before it is removed will make it easier
       /* var timeout = null;
        var hideSign = function() {
            timeout = setTimeout(function(){
                target.select(".nodeRunDiscovery").style("display", "none");
            }, 1000);
        };
        if (datum.edge_neighbours) {
            target.select(".nodeRunDiscovery").style("display", null);
        }
        else {
            target
                .on("mouseover", function () {
                    target.select(".nodeRunDiscovery").style("display", null);
                    clearTimeout(timeout);
                })
                .on("mouseleave", function () {
                    hideSign();
                });
        }*/

        // Remove the "+" sign if appropriate.
        this._removeExtendButtonWhenAppropriate(datum, target);
    },

    // Constructs HTML elements for the three categories of related nodes.
    //
    // datum       - Extended root node data (could be either a standalone or a collection),
    // target      - SVG element that represents the node data,
    // icon_holder - HTML element to which buttons and icons should be appended to.
    //
    _constructExtendModelCategories : function (datum, target, icon_holder) {
        "use strict";

        this.NODE_CATEGORIES.forEach(bindContext(this, function (node_category) { 
            var anchor_link = icon_holder
                .append("a")
                .attr("id", node_category.id)
                .attr("title", node_category.label)
                .classed("menuItem", true)
                .classed("closed", true)
                .classed("extend-model-link", true)
                .attr("onmouseout", "this.querySelector('img').src='" + node_category.icon_normal + "';")
                .attr("onmouseover", "this.querySelector('img').src='" + node_category.icon_hot + "';")
                .on("click", bindContext(this, function () {
                    d3.event.preventDefault();
                    this.extendModel(datum, target, 
                        bindContext(this, node_category.node_getter_func), 
                        undefined,
                        bindContext(this, this._showEphemeralMessageForNode, 
                            datum, target, labels.NoMoreRelatedNodes));
                }));
            anchor_link
                .append("img")
                .attr("src", node_category.icon_normal);

            anchor_link
                .append("span")
                .text("--");
        }));
    },

    // Remove the "+" sign if the given node is known to have no more new nodes.
    //
    // datum  - Extended root node data (could be either a standalone or a collection),
    // target - SVG element that represents the node data.
    //
    _removeExtendButtonWhenAppropriate : function (datum, target) {
        "use strict";

        var new_node_data = this._related_nodes_cache[datum.id];

        if (new_node_data) {
            this.getNewAndSuppressedNodesAndLinks(datum, bindContext(this, function (nodes_data) {
                if (this._countNodes(datum, nodes_data) === 0 && this._countLinks(datum, nodes_data) === 0) {
                    target.select(".nodeRunDiscovery").remove();
                }
            }));
        }
    },

    // Adds new nodes and links that are related to the given node, and highlights
    // them once they are successfully rendered.
    //
    // datum      - Extended root node data (could be either a standalone or a collection),
    // nodes_data - New nodes and links information,
    // callback   - (Optional) Function to be called after adding the new nodes.
    //
    _addMoreNodesToModel : function (datum, target, nodes_data, callback, no_undo) {
        "use strict";

        // Remove all special flags because we want to treat those flagged nodes as if
        // they are new nodes to current visualization.

        d3.keys(nodes_data.nodes).forEach(bindContext(this, function (node_id) {
            var the_node = this.nodes_map[node_id];
            if (the_node) {

                this._clearMarkDeletionFlag(the_node);

                if (this.isCollectionNode(the_node) && this.collectionMembersLoaded(the_node)) {
                    the_node.members.forEach(bindContext(this, function (m) {
                        this._clearMarkDeletionFlag(this.nodes_map[m]);
                    }));
                }
            }
            else {
                this._clearMarkDeletionFlag(nodes_data.nodes[node_id]);
            }
        }));
        nodes_data.links.forEach(bindContext(this, function (link) {
            var link_id = this._buildLinkId(link.src_id, link.tgt_id);
            if (this.links_map[link_id]) {
                this._clearMarkDeletionFlag(this.links_map[link_id]);
            }
        }));

        this._handleData(nodes_data, datum, bindContext(this, function () {
            var added_nodes = this.node_sel.filter(function (vd) {
                return nodes_data.nodes[vd.id];
            });

            // Push event to event pump.

            if (!no_undo && this.pushEvent !== undefined) {
                this.pushEvent(this.EVENT_EXTEND_MODEL, {
                    nodes       : nodes_data.nodes,
                    links       : nodes_data.links,
                    extend_data : datum,
                    undone      : false,
                    undo : function (data) {
                        
                        d3.values(data.nodes).concat(data.links).forEach(
                            bindContext(this, function (d) {
                                this._setNodeAsMarkedDeleted(d);
                            })
                        );

                        this._handleData({
                            nodes: data.nodes,
                            links: data.links
                        }, datum);

                        this._constructExtendButtonForEachNode(datum, target);
                        this.updateSideBarMenu();

                        return true;
                    },
                    redo : function (data) {
                        
                        // Call the same method with recorded data
                        this._addMoreNodesToModel(datum, target, {
                            nodes: data.nodes,
                            links: data.links
                        }, callback, true);

                        return true;
                    }
                });
            }

            // Highlight all newly added items.

            if (this.highlightNode !== undefined) {
                var objref = this;
                added_nodes.each(function (vd) {
                    if (vd.id !== datum.id) {
                        objref.highlightNode(this, datum["short_name"] +
                            " expansion", true);
                    }
                });
            }

            if (callback) {
                callback();
            }
        }));
    },

    // Restores the given removed nodes.
    //
    // nodes_data - Nodes to be restored,
    // callback   - (Optional) Function to be executed after the node's restore.
    //
    _restoreImmediateRemovedNodes : function (nodes_data, callback) {
        "use strict";

        var restore_removed_nodes = bindContext(this, function (data) {
            this.restoreNode(d3.values(data.nodes),
                this.options.layout_iterations.extend_model);
        });

        if (this.pushEvent) {
            // Push event to event pump.
            this.pushEvent(this.EVENT_EXTEND_MODEL, {
                undone : false,
                nodes  : d3.values(nodes_data.nodes),
                undo : function (data) {
                    this.removeNode(data.nodes,
                        this.options.layout_iterations.extend_model);
                    return true;
                },
                redo : function (data) {
                    restore_removed_nodes(data);
                    return true;
                }
            });
        }

        restore_removed_nodes(nodes_data);
        
        if (callback) {
            callback();
        }
    },

    // Checks if the given node is completely new to the current visualization.
    //
    // datum - Interested target node data (could be either a standalone or a collection).
    //
    _isNewToViz : function (datum) {
        "use strict";

        // A node is new to the visualization if it is not found in nodes_map,
        // removed_nodes and collection_members.

        return [this.nodes_map, this.removed_nodes, this.collection_members]
            .every(function (obj) {
                return obj[datum.id] === undefined;
            });
    },

    // From the given data (of format mentioned in the class description above), filters nodes 
    // that are relevant to the extended root node and links associated with them. A node's 
    // relevancy is determined by if it is either directly-connected to the extended root nodes 
    // or is grouped together with such directly-connected nodes.
    //
    // datum      - Extended root node data (could be either a standalone or a collection),
    // nodes_data - Response JSON data from backend.
    //
    _filterDirectlyConnectedData : function (datum, nodes_data) {
        "use strict";

        var filtered_data = {
                nodes: {},
                links: []
            },
            related_nodes  = {},
            ext_root_nodes = this._getExtendedRootNodes(datum),
            coll_members   = this._getMemberToCollectionMappings(nodes_data, true),
            addCandidateNodes = function (node_id) {
                if (coll_members[node_id]) {
                    related_nodes[coll_members[node_id]] = true;
                }
                else {
                    related_nodes[node_id] = true;
                }
            };
        
        // Select all links and IDs of qualified nodes.
        nodes_data.links.forEach(function (link) {
            filtered_data.links.push(link);

            // We'll only include nodes which have a direct connection to any of the extended root nodes.
            if (ext_root_nodes[link.src_id] && ext_root_nodes[link.tgt_id] === undefined) {
                addCandidateNodes(link.tgt_id);
            }
            else if (ext_root_nodes[link.tgt_id] && ext_root_nodes[link.src_id] === undefined) {
                addCandidateNodes(link.src_id);
            }
        }, this);
        
        // Assign the qualified nodes' values.
        d3.keys(nodes_data.nodes).forEach(function (id) {
            if (related_nodes[id]) {
                var node = nodes_data.nodes[id];
                if (node) {
                    related_nodes[id]       = node;
                    filtered_data.nodes[id] = node;
                }
            }
        }, this);

        // Collect IDs of nodes to be added and nodes that already exist.
        var all_involved_nodes = copyObject(ext_root_nodes);
        d3.values(related_nodes)
            .concat(d3.values(this.nodes_map))
            .concat(d3.values(this.removed_nodes))
            .forEach(
                bindContext(this, function (the_node) {
                    all_involved_nodes[the_node.id] = true;
                    if (this.isCollectionNode(the_node)) {
                        the_node.members.forEach(function (m) {
                            all_involved_nodes[m] = true;
                        });
                    }
                })
            );
        
        // Filter out irrelevant links where relevancy of a link is determined by whether it is 
        // associated with nodes that are either to be added or already in the visualization.
        filtered_data.links = filtered_data.links.filter(function (link) {
            return (
                (all_involved_nodes[link.src_id] || all_involved_nodes[coll_members[link.src_id]]) && 
                (all_involved_nodes[link.tgt_id] || all_involved_nodes[coll_members[link.tgt_id]])
            );
        });

        // Copy other attributes of original AJAX response object to the newly transformed one.
        d3.keys(nodes_data).forEach(function (key) {
            if (!filtered_data[key]) {
                filtered_data[key] = nodes_data[key];
            }
        });

        return filtered_data;
    },

    // Retrieves related nodes and links for the given node. It sends an AJAX request
    // to obtain the aforementioned data, filters only relevant nodes and links for an 
    // extended root node are left (by using _filterDirectlyConnectedData) and caches 
    // the filtered data so that subsequent requests for the same node does not have to 
    // ask backend again.
    //
    // datum  - Extended root node data (could be either a standalone or a collection),
    // action - Function to process once the requested data is available.
    //
    _performActionOnRelatedNodesData : function (datum, action) {
        "use strict";

        // Function that copies the related nodes (same format described in the class 
        // description above) before applying action on the data, so that the data saved
        // in the cache is left intact.
		var objref = this;
        var copyData = function (related_nodes_data) {
            var copied_data = {
                nodes: {},
                links: []
            };
            
            d3.keys(related_nodes_data.nodes).forEach(function (node_id) {
                copied_data.nodes[node_id] = copyObject(related_nodes_data.nodes[node_id]);
            });
            related_nodes_data.links.forEach(function (link) {
                copied_data.links.push(copyObject(link));
            });

            // Copy other attributes like suppressed IDs.
            d3.keys(related_nodes_data).forEach(function (key) {
                if (!copied_data[key]) {
                    copied_data[key] = related_nodes_data[key];
                }
            });

            return copied_data;
        };

        if (this._related_nodes_cache[datum.id]) {
            action(copyData(this._related_nodes_cache[datum.id]));
        }
        else {
            var ext_root_nodes = this._getExtendedRootNodes(datum, true);
            
            // All nodes in the visualization including group members and removed 
            // ones except the provided node ID.
            var other_node_ids = this._getAllNodeIds().filter(function (node_id) {
                return ext_root_nodes[node_id] === undefined;
            });
			var cmd = "showCIrel";
			if (datum.nodeType == "service")
			{
				cmd = "showModuleLinkToCI";
			}
			Visualforce.remoting.Manager.invokeAction(_RemotingActions.getGraphJSON, cmd, datum.actualId, '',
				function(result, event) 
				{
					if(event.type === 'exception') {
						console.log("exception");
					} 
					else if (event.status) {
						populatedRelationShips(result.edges, false);
						var	data = convertGraphData(result);
						data['suppressed'] = [];
						var filtered_data = objref._filterDirectlyConnectedData(datum, data);
						d3.keys(ext_root_nodes).forEach(bindContext(objref, function(id) {
							objref._related_nodes_cache[id] = filtered_data;
						}));
						action(copyData(filtered_data));
					} 
					else {
						console.log(event.message);
					}
			},{escape: false});

            // Send an AJAX request.
            /*tw.xhr_client.jsonPostForm(this.options.ajax_url, {
                extended_root_ids : Object.toJSON(d3.keys(ext_root_nodes)),
                already_available : Object.toJSON(other_node_ids)
            }, bindContext(this, function (error, data) {
                if (error) {
                    return;
                }

                var filtered_data = this._filterDirectlyConnectedData(datum, data);
                d3.keys(ext_root_nodes).forEach(bindContext(this, function(id) {
                    this._related_nodes_cache[id] = filtered_data;
                }));
                action(copyData(filtered_data));
            }));*/
        }
    },

    // Gets member-to-collection ID mapping.
    //
    // nodes_data       - Data containing nodes,
    // include_unloaded - (Optional) Whether to include IDs of collection members which are not yet available 
    //                    in the visualization because the collection node represents them as a whole. Default
    //                    is false.
    //
    _getMemberToCollectionMappings : function (nodes_data, include_unloaded) {
        "use strict";

        var coll_members = {};

        d3.keys(nodes_data.nodes).forEach(bindContext(this, function (node_id) {
            var the_node = nodes_data.nodes[node_id];
            if (this.isCollectionNode(the_node)) {

                // Collect information about members that are not available in the given data.
                if (!this.collectionMembersLoaded(the_node) && include_unloaded) {
                    the_node.members.forEach(function (m) {
                        coll_members[m] = node_id;
                    });
                }
            }
            else if (this._hasCollectionInfo(the_node)) {
                // Node might be removed and thus taken out as a member from its collection.
                coll_members[node_id] = the_node.collection;
            }
        }));

        return coll_members;
    },

    // Gets collection-to-members information. Returns an object whose attributes represent
    // collection IDs and value of each attribute represents members of the respective 
    // collection.
    //
    // nodes_data       - Data containing nodes,
    // include_unloaded - (Optional) Whether to include IDs of collection members which are not yet available 
    //                    in the visualization because the collection node represents them as a whole. Default
    //                    is false.
    //
    _getCollectionToMemberMappings : function (nodes_data, include_unloaded) {
        "use strict";

        var coll_to_mem  = {};

        d3.keys(nodes_data.nodes).forEach(bindContext(this, function (node_id) {
            var the_node = nodes_data.nodes[node_id];
            if (this.isCollectionNode(the_node)) {
                if (coll_to_mem[the_node.id] === undefined) {
                    coll_to_mem[the_node.id] = [];
                }

                // Collect information about members that are not available in the given data.
                if (!this.collectionMembersLoaded(the_node) && include_unloaded) {
                    the_node.members.forEach(function (m) {
                        coll_to_mem[the_node.id].push(m);
                    });
                }
            
            }
            else if (this._hasCollectionInfo(the_node)) {
                if (coll_to_mem[the_node.collection] === undefined) {
                    coll_to_mem[the_node.collection] = [];
                }
                coll_to_mem[the_node.collection].push(the_node.id);
            }
        }));

        return coll_to_mem;
    },

    // Gets all nodes that are known to the current visualization.
    //
    _getAllNodeIds : function () {
        "use strict";

        var existing_nids = [],
            viz_state = this.getVizState();

        existing_nids = d3.keys(viz_state.nodes);
        d3.values(viz_state.collections).forEach(function (col) {
            existing_nids.concat(col.members);
        });

        return d3.keys(arrayToSet(existing_nids));
    },

    // Gets extended root nodes on which context menu is shown for.
    //
    // datum              - Extended root node data (could be either a standalone or a collection),
    // include_collection - (Optional) True if a virtual node representing the given collection
    //                      should be included as one of the extended root nodes. Default is false.
    //
    _getExtendedRootNodes : function (datum, include_collection) {
        "use strict";

        var ext_root_nodes = {};

        if (datum.members) {
            if (include_collection) {
                ext_root_nodes[datum.id] = true;
            }
            datum.members.forEach(function (i) {
                ext_root_nodes[i] = true;
            });
        }
        else {
            ext_root_nodes[datum.id] = true;
        }

        return ext_root_nodes;
    },

    // Selects nodes from the given nodes data, that satisfy the provided filter function. It performs 
    // the selection by first classifying nodes into standalones and different types of collections, and 
    // then applying the filter function on those classified data.
    //
    // datum       - Extended root node data (could be either a standalone or a collection),
    // nodes_map   - Object containing node information,
    // links       - Array containing link information,
    // filter_func - Function to test if a node is qualified for selection. The function should accept 
    //               one parameter representing a node and return boolean value indicating if the node
    //               satisfies the criteria. For example, if we want to get all currently removed nodes
    //               adjacent to the given extended root node, the function will check if a node has the
    //               "removed" flag true.
    //
    _getQualifiedNeighbours : function (datum, nodes_map, links, filter_func) {
        "use strict";

        // Contains resulting nodes that satisfy the filter function.
        var qualified_nodes = {};

        var unl_mem_to_col  = {}, // Members-to-Collection for members that are NOT available in the given data
            l_mem_to_col    = {}, // Members-to-Collection for members that are available in the given data
            standalones     = {}, // Non-collection nodes
            coll_mem_states = {}, // Indexed by collection ID and contains collection and respective members together
            
            ext_root_nodes   = this._getExtendedRootNodes(datum),

            is_mem_available = function (coll_node) {
                // Check if members of the collection is available in the given data.
                return coll_node.members.every(function (m) {
                    return (nodes_map[m] !== undefined);
                });
            };

        // Distinguish nodes according to three types: standalone nodes, collections 
        // with members loaded, and collections with no member loaded.

        d3.keys(nodes_map).forEach(bindContext(this, function (node_id) {
            var the_node = nodes_map[node_id];
          
            if (this.isCollectionNode(the_node)) {

                // Initialize if collection and member information is not available yet.
                if (coll_mem_states[node_id] === undefined) {
                    coll_mem_states[node_id] = {
                        coll_state : the_node,
                        mem_states : {}
                    };
                }

                // Collect two types of collection members - those that are not available and 
                // those that are available in the data. For the latter, populate collection 
                // and member information as well.

                if (is_mem_available(the_node)) {
                    the_node.members.forEach(bindContext(this, function (m) {
                        l_mem_to_col[m] = node_id;
                        coll_mem_states[node_id].mem_states[m] = nodes_map[m];
                    }));
                }
                else {
                    the_node.members.forEach(function (m) {
                        unl_mem_to_col[m] = node_id;
                    });
                }

            }
            else {
                if (this._hasCollectionInfo(the_node)) {

                    // Collection member nodes which may or may not be found in the respective 
                    // collection node's members list because of some reason - such as it is 
                    // currently removed. Collect and associate collection information accordingly.

                    var col_node = nodes_map[the_node.collection];
                    if (col_node) {
                        if (coll_mem_states[col_node.id] === undefined) {
                            coll_mem_states[col_node.id] = {
                                coll_state : col_node,
                                mem_states : {}
                            };
                        }
                        coll_mem_states[col_node.id].mem_states[node_id] = the_node;
                        l_mem_to_col[node_id] = col_node.id;
                    }
                    else {
                        // Node has a collection information that is not found in the given data.
                        throw Error("Unknown collection - " + the_node.collection);
                    }
                }
                else {
                    // Normal standalone nodes.
                    standalones[node_id] = the_node;
                }
            }
        }));

        // Based on the links, determine if a source or a target is qualified for selection.
        // One of the two ends must be found in a set of extended root nodes as we are interested
        // only in nodes or links that are adjacent to the extended root nodes.
        
        links.forEach(bindContext(this, function (link) {
            [
                {
                    known_id : link.src_id,
                    other_id : link.tgt_id
                },
                {
                    known_id : link.tgt_id,
                    other_id : link.src_id
                }
            ].forEach(bindContext(this, function (link_ends) {
                if (ext_root_nodes[link_ends.known_id]) {

                    // If the node to be examined is a collection node, we ignore it because we
                    // handle collection nodes by means of members.
                    if(nodes_map[link_ends.other_id] && 
                       this.isCollectionNode(nodes_map[link_ends.other_id])) {
                        return;
                    }

                    if (standalones[link_ends.other_id]) {
                        // The node to be examined is a standalone node, so just check if it satisfies 
                        // the filter function.
                        if (filter_func(standalones[link_ends.other_id])) {
                            qualified_nodes[link_ends.other_id] = standalones[link_ends.other_id];
                        }
                    }
                    else if (unl_mem_to_col[link_ends.other_id]) {

                        // The node to be examined is collection member whose data is not available in the 
                        // given nodes data, so gets the respective collection node and checks the filter
                        // function on the collection node.

                        var unl_coll_node = coll_mem_states[unl_mem_to_col[link_ends.other_id]].coll_state;
                        if (filter_func(unl_coll_node)) {
                            qualified_nodes[unl_coll_node.id] = unl_coll_node;
                        }

                    }
                    else if (l_mem_to_col[link_ends.other_id]) {

                        // The node to be examined is collection member whose data exists in the given 
                        // nodes data, gets the respective collection node and other members which are adjacent 
                        // to the extended root node, and checks the filter function on both sets. Those
                        // other members will go through this same branch but will not give a problem as we use
                        // node IDs to store data in qualified_nodes - i.e. no duplicate data.

                        var l_coll_node  = coll_mem_states[l_mem_to_col[link_ends.other_id]].coll_state,
                            mem_states = coll_mem_states[l_mem_to_col[link_ends.other_id]].mem_states;
                        
                        if (filter_func(l_coll_node)) {
                            qualified_nodes[l_coll_node.id] = l_coll_node;
                        }
                        d3.values(mem_states).forEach(bindContext(this, function(ms) {
                            if (filter_func(ms) && ms.id === link_ends.other_id) {
                                qualified_nodes[ms.id] = ms;
                            }
                        }));

                    }
                }
            }));
        }));
        
        return qualified_nodes;
    },

    // Returns a node count from the given data which may contain additional data
    // that should not be counted (e.g. virtual nodes representing collections along with 
    // their respective members).
    //
    // datum      - Interested target node data (could be either a standalone or a collection).
    // nodes_data - Data containing nodes.
    //
    _countNodes : function (datum, nodes_data) {
        "use strict";

        var node_count   = 0,
            have_seen    = {},
            coll_to_mem  = this._getCollectionToMemberMappings(nodes_data);
        
        // First, count among collection-related nodes.
        // If any member of a collection is mentioned in nodes data, the collection node 
        // will be ignored. Otherwise, it is counted as one.
        d3.keys(coll_to_mem).forEach(function (coll) {
            have_seen[coll] = true;

            if (coll_to_mem[coll].length > 0) {
                coll_to_mem[coll].forEach(function (m) {
                    have_seen[m] = true;
                    node_count += 1;
                });
            }
            else {
                node_count += 1;
            }
        });

        // Then, count remaining standalone nodes.
        d3.keys(nodes_data.nodes).forEach(function (node_id) {
            if (have_seen[node_id]) {
                return;
            }
            node_count += 1;
        });

        return node_count;
    },

    // Returns a link count from the given data which may contain additional data
    // that should not be counted (e.g. links that are associated with target node
    // but are already available in the visualization).
    //
    // datum      - Interested target node data (could be either a standalone or a collection).
    // nodes_data - Data containing nodes.
    //
    _countLinks : function (datum, nodes_data) {
        "use strict";

        var link_count     = 0,
            ext_root_nodes = this._getExtendedRootNodes(datum);
        
        nodes_data.links.forEach(bindContext(this, function (link) {
            var link_id     = this._buildLinkId(link.src_id, link.tgt_id),
                the_link    = this._getExistingLinkIfAvailable(link),
                link_is_new = (this.links_map[link_id] === undefined || this._isMarkedDeleted(the_link)),
                link_is_from_root = (ext_root_nodes[link.src_id] !== undefined || ext_root_nodes[link.tgt_id] !== undefined);
            
            if (link_is_new && link_is_from_root) {
                link_count++;
            }
        }));

        return link_count;
    },

    // Checks if a node is marked as deleted. 
    //
    // datum - Interested target node data (could be either a standalone or a collection).
    //
    _isMarkedDeleted : function (datum) {
        "use strict";

        return datum.fake === true;
    },

    // Marks a node as deleted.
    //
    // datum - Interested target node data (could be either a standalone or a collection).
    //
    _setNodeAsMarkedDeleted : function (datum) {
        "use strict";

        datum.fake = true;
    },

    // Checks if a node has any collection information.
    //
    // datum - Interested target node data (could be either a standalone or a collection).
    //
    _hasCollectionInfo : function (datum) {
        "use strict";

        return (datum.collection !== "" && datum.collection !== undefined);
    },

    // Clears flags that marks a node as as deleted.
    //
    // datum - Interested target node data (could be either a standalone or a collection).
    //
    _clearMarkDeletionFlag : function (datum) {
        "use strict";

        delete datum.fake;
    },

    // Gets an existing link from internal states if the given link is already available in
    // current visualization. If it is not available, return the given link state back.
    //
    // datum - Interested target link data.
    //
    _getExistingLinkIfAvailable : function (link) {
        "use strict";

        return (this.links_map[this._buildLinkId(link.src_id, link.tgt_id)] || link);
    }
});

/* global d3, bindContext, TWClass */
/* jshint sub: true, nonew: false, scripturl: true */

// Inline visualization

if (tw === undefined) {
    var tw = {};
}
if (tw.viz === undefined) {
    tw.viz = {};
}

// Mixin for event collection
//
tw.viz.EventPumpMixIn = TWClass.create({

    // Data load

    EVENT_SET_INITIAL_DATA    : "set initial data",

    // Expand / extend model

    EVENT_EXPAND_COLLECTION   : "expand collection",
    EVENT_COLLAPSE_COLLECTION : "collapse collection",
    EVENT_EXTEND_MODEL        : "extend model",

    // Node removal

    EVENT_REMOVE_NODE       : "node removal",
    EVENT_REMOVE_LINK       : "link removal",
    EVENT_REMOVE_SELECTED   : "remove selected",
    EVENT_KEEP_SELECTED     : "keep selected",
    EVENT_RESTORE_NODE      : "restore node",       // restore a removed node

    // Selection

    EVENT_SELECTION_CHANGE  : "selection change",

    // Note changes

    EVENT_NOTE_ADD          : "note add",
    EVENT_NOTE_EDIT         : "note edit",
    EVENT_NOTE_DELETE       : "note delete",

    // User groups: hulls, collections

    EVENT_CREATE_USER_COLLECTION : "create user collection",
    EVENT_CREATE_USER_HULL       : "create user hull",

    EVENT_RENAME_USER_COLLECTION : "rename user collection",

    // Undo / redo events

    EVENT_UNDO : "undo",
    EVENT_REDO : "redo",

    // Layout change

    EVENT_LAYOUT_CHANGE : "layout change",

    // Node interaction

    EVENT_NODE_DRAG : "node drag",

    // Node kind show/hide

    EVENT_HIDE_NODE_KIND : "hide node kind",
    EVENT_SHOW_NODE_KIND : "show node kind",

    // Generic event for explicit hide/remove and unhide/restore

    EVENT_NODE_VISIBILITY_CHANGE : "node visibility changed",

    // Exclusion rules

    EVENT_CREATE_EXCLUSION_RULES         : "create removal rule",
    EVENT_CANCEL_CREATE_EXCLUSION_RULES  : "cancel create removal rule",
    EVENT_DELETE_EXCLUSION_RULES         : "delete removal rule",
    EVENT_CANCEL_DELETE_EXCLUSION_RULES  : "cancel delete removal rule",

    // Shared overrides

    EVENT_UPDATE_SHARED_OVERRIDES        : "update shared override",
    EVENT_CANCEL_UPDATE_SHARED_OVERRIDES : "cancel update for shared override",

    subscribers         : undefined,
    subscribersPerEvent : undefined,

    initEventPump : function () {
        "use strict";

        this.subscribers = {};
        this.subscribersPerEvent = {
            "*" : []   // The catchall list
        };
    },

    // Push a new event.
    //
    // event_name    - Name of the event. Identifies the event for subscribers.
    //                 Should be the same for all events of the same type, one
    //                 of the constants in this class: EVENT_...
    //
    // data          - Data related to the event (event specific).
    //        {
    //            undone    : <optional: flag to indicate if the event was undone>
    //            undo      : <optional: function to reverse the effects of the event>
    //            redo      : <optional: function to redo the effects of the event>
    //            undo_name : <optional: string or a function that will return
    //                                   the name of the operation to be undone.
    //                                   If it's a function, the function will get
    //                                   event "data" as a parameter.>
    //            redo_name : <optional: analogous to "undo_name", but for redo.>
    //        }
    //
    //        NOTE: undo/redo function should return true/false to indicate if the
    //              action was successful.
    //
    // push_callback - optional: If specified the pushing of the event is done in an
    //                           async way. If null it is still done async but
    //                           no callback is called.
    //
    pushEvent : function (event_name, data, push_callback) {
        "use strict";

        var callEventHandler = bindContext(this, function (callback) {
                try {
                    bindContext(this, callback)(event_name, data);
                }
                catch(e) {
                    console.log("Internal Error: Error during handling of", event_name,
                                "Error:", e, "Data:", data);
                }
            }),
            callSyncAsync = function (item, idx, arr) {
                // Call event handlers either sync or async

                if (push_callback !== undefined) {

                    window.setTimeout(function () {
                        callEventHandler(item);

                        if (push_callback !== null && idx === arr.length-1) {
                            push_callback();
                        }
                    }, 10);
                }
                else {
                    callEventHandler(item);
                }
            };

        this.subscribersPerEvent["*"].forEach(function (item, idx, arr) {
            callSyncAsync(item, idx, arr);
        }, this);

        if (event_name in this.subscribersPerEvent) {
            this.subscribersPerEvent[event_name].forEach(function (item, idx, arr) {
                callSyncAsync(item, idx, arr);
            }, this);
        }
    },

    // Subscribe a given handler to list of events.
    //
    // name      - Unique name for the handler.
    // events    - List of events to subscribe to.
    // handler   - Event handler. The function receives name and data
    //             as arguments.
    // overwrite - (optional) Flag to indicate that we might overwrite an
    //             existing handler.
    //
    subscribeEventHandler : function (name, events, handler, overwrite) {
        "use strict";

        var existing = this.subscribers[name];

        if (existing !== undefined && overwrite !== true) {
            console.log("Internal Error: Can't overwrite existing event handler");
            return false;
        }

        // Register handler in subscribers

        this.subscribers[name] = [ handler, events ];

        // Register handler in event lookup object

        events.forEach(function (item) {
            if (!(item in this.subscribersPerEvent)) {
                this.subscribersPerEvent[item] = [];
            }
            this.subscribersPerEvent[item].push(handler);
        }, this);

        return true;
    },

    // Remove an existing handler.
    //
    // name - Name of the handler to remove.
    //
    unsubscribe : function (name) {
        "use strict";

        var sub = this.subscribers[name];

        if (sub === undefined) {
            return;
        }

        sub = sub[0];
        delete this.subscribers[name];

        d3.keys(this.subscribersPerEvent).forEach(function (key) {
            var list = this.subscribersPerEvent[key],
                subindex = list.indexOf(sub);

            if (subindex !== -1) {
                list.splice(subindex, 1);
            }
        }, this);
    }
});
/* global d3, TWClass, Control, mergeObjects, bindContext, showConfirmDialog */

if (tw === undefined) {
    var tw = {};
}

/**
 * Stand-alone class providing connectivity check functionality and generic API
 * request interface. Also provides UI for error handling.
 *
 * Generally there should only be one global instance of this - it is
 * created automatically as tw.xhr_client.
 *
 * Dependencies:
 *  - d3
 *  - common.js
 *  - control_modal.js
 *  - event.simulate.js
 */
tw.XHRClient = TWClass.create({

    connection_alive        : true,         // Whether the connection is alive
                                            // (if not, no further critical
                                            //  requests will be attempted,
                                            //  unless they are retries).

    last_critical_error     : undefined,    // Last critical request error.

    dialog                  : undefined,    // The dialog used to display
                                            // critical request error.

    auto_retry_seconds      : 10,           // Second between auto-retries
                                            // for critical requests.

    auto_retry_countdown    : 0,            // Current seconds left on countdown

    next_request_id         : 0,            // Request id - bumped with each
                                            // request. Used to identify
                                            // requests for retrying etc.

    retry_request_id        : undefined,    // id of the request being on retry
                                            // countdown

    need_reload             : false,        // There's nothing we can do to
                                            // fix the request error other
                                            // than reload the page.

    // dialog modes (various ways of handling errors)

    MODE_DEFAULT            : "MODE_DEFAULT", // generic message, allow retry

    // modes for session invalid/timeout problems
    MODE_SESSION_INVALID    : "MODE_SESSION_INVALID",   // prompt for login
                                                        // (no nonce)
    MODE_RELOAD_ONLY        : "MODE_RELOAD_ONLY",       // no retry, reload only
                                                        // (invalid session,
                                                        //  request with nonce)

    MODE_MESSAGES : {
        MODE_DEFAULT : "Error connecting to the server. " +
                       "Please check your connection and ensure that the " +
                       "Discovery Appliance is running.",
        MODE_SESSION_INVALID : "Error connecting to the server. " +
                               "Your session probably timed out. " +
                               "To retry the last request without " +
                               "losing work in progress, please log in again first: " +
                               "<a href=\"/ui/Home\" target=\"_blank\" rel=\"noopener noreferrer\">login in new tab/window</a>",
        MODE_RELOAD_ONLY : "Error connecting to the server. " +
                           "Your session probably timed out and you need to " +
                           "log in again. We are sorry, but for security " +
                           "reasons, any unsaved changes will be lost."
    },

    //
    // Requests
    //

    /**
     * Perform a JSON-based XHR request, with configurable method,
     * data (JSON string) and callback.
     *
     * This function is our version of d3.xhr with a standard way of handling
     * errors.
     *
     * @param {string} url - the URL to send the request to.
     * @param {string} method - the request method: "GET", "POST", "PUT" etc
     * @param {string | Object} data - the data string to pass along with the
     *                          request.
     *                          Object-based data will be converted to
     *                          form-encoded string.
     * @param {function} callback - the callback to be invoked once the request
     *                   is complete. Should take (error, response) parameters.
     *
     *                   If an error occurred and callback returns true,
     *                   it means that the callback handled the error
     *                   - no standard error handling will take place.
     * @param {boolean} [parse_json=true] - whether to parse JSON data and call
     *                  the callback with parsed JSON as the response instead
     *                  of a raw response object.
     * @param {boolean} [critical=true] - whether the request is "critical"
     *                  and means that it makes little sense to proceed with it
     *                  erroring. If such request errors, it will produce an
     *                  obtrusive dialog message and block further critical
     *                  requests.
     *                  Non-critical request errors won't be reported in an
     *                  obtrusive way.
     * @param {string} [content_type=application/json]
     *                 - the Content-Type header value to use.
     * @param {boolean} [is_retry] - if true, indicates that the request is
     *                  a retry of a previous one.
     * @param {int} [request_id] - internal id used to identify the request.
     */
    jsonRequest : function(url, method, data, callback, parse_json,
                           critical, content_type, is_retry, request_id) {
        "use strict";

        /*critical = (critical === undefined) ? true : critical;

        if (request_id === undefined) {
            // bump request id after use
            request_id = this.next_request_id++;
        }

        if (critical && !this.connection_alive && !is_retry &&
                this.last_critical_error) {
            // refuse any new connections - return last error

            if (callback) {
                callback(this.last_critical_error, undefined);
            }

            return;
        }

        parse_json = (parse_json === undefined) ? true : parse_json;
        content_type = (content_type === undefined) ?
                        "application/json" : content_type;

        var request_params = {
            request_id: request_id,
            url: url, method: method, data: data,
            callback: callback, parse_json: parse_json,
            critical: critical, content_type: content_type,
            is_retry: is_retry, has_nonce: this._requestHasNonce(url, data)
        };

        d3.xhr(url)
            .header("Content-Type", content_type)
            .send(
                method,
                data,
                bindContext(this, function (error, response) {

                    // Filter out while(1); from the response text

                    if (response && response.responseText.lastIndexOf("while(1);", 0) === 0) {
                        response = mergeObjects(response, {
                            responseText : response.responseText.substr(9)
                        });
                    }

                    if (response && parse_json) {
                        response = JSON.parse(response.responseText);
                    }

                    var cb_result;

                    if (callback) {
                        try {
                            cb_result = callback(error, response);
                        }
                        catch(e) {
                            console.log("Internal error: callback error", e);
                        }
                    }

                    if (error) {
                        var prefix = is_retry ? "Retry " : "";

                        console.log(prefix + "Request error: " + error.status +
                                    " " + error.statusText + " for URL: " + url);
                        console.log(prefix + "Request error details: ", error);

                        if (cb_result !== true) {
                            if (critical) {
                                // The callback errored, did not fire or
                                // did not indicate that it handled the response
                                // error.

                                this._criticalRequestError(error, response,
                                                           request_params);
                            }
                            else {
                                this._nonCriticalRequestError(error, response,
                                                              request_params);
                            }
                        }
                    }
                    else {
                        this._requestSuccess(request_params);
                    }
                })
            );*/
    },

    /**
     * Perform a JSON-based XHR request as a GET request with no payload.
     *
     * The callback should take (error, response) args.
     */
    jsonGet : function(url, callback, parse_json, critical) {
        "use strict";

        return this.jsonRequest(url, "GET", undefined, callback, parse_json,
                                critical);
    },

    /**
     * Perform a XHR request as a form-encoded POST request, expecting
     * a JSON-serialized response.
     *
     * @param {string | Object} parameters - the data string to pass with the
     *                          POST or an Object to be form-encoded.
     *
     *                          This will NOT perform JSON conversion for
     *                          request data. If you have any JSON data to send,
     *                          use JSON.stringify().
     */
    jsonPostForm : function(url, parameters, callback, parse_json, critical) {
        "use strict";

        // uses prototype.js
        var data = Object.isString(parameters) ?
                   parameters : Object.toQueryString(parameters);

        return this.jsonRequest(
            url, "POST", data, callback, parse_json, critical,
            "application/x-www-form-urlencoded; charset=UTF-8"
        );
    },

    //
    // UI
    //

    /**
     * Show "connection lost" indicator in the top bar.
     * Assumes that there's a DOM element with id: connectionLostIndicator.
     */
    showConnectionLostIndicator : function() {
        "use strict";

        var indicator = $("connectionLostIndicator");

        if (indicator) {
            indicator.show();
        }
    },

    /**
     * Hide "connection lost" indicator in the top bar.
     * Assumes that there's a DOM element with id: connectionLostIndicator.
     */
    hideConnectionLostIndicator : function() {
        "use strict";

        var indicator = $("connectionLostIndicator");

        if (indicator) {
            indicator.hide();
        }
    },

    /**
     * Show the connection error dialog.
     *
     * It will have "Retry" and "Dismiss" buttons and will auto retry.
     *
     * It also has an expandable error details section.
     *
     * @param {string} [mode="MODE_DEFAULT"] control the dialog text and
     *        behaviour based on the problem and what can be done with it.
     *
     *        In MODE_DEFAULT, a generic error message is shown and retry
     *        is allowed.
     *
     *        In MODE_SESSION_INVALID, a message specific to a session timeout
     *        is shown, as well as a link that opens up the login page in a new
     *        tab/window. Retry is allowed.
     *
     *        In MODE_RELOAD_ONLY, a message informing of work being lost
     *        is displayed and only a manual, on-demand page reload is possible
     *        as opposed to retry.
     */
    showConnectionErrorDialog : function(error, request_params, mode) {
        "use strict";

        if (mode === undefined) {
            mode = this.MODE_DEFAULT;
        }

        var error_details_el = new Element("div"),
            can_retry        = mode !== this.MODE_RELOAD_ONLY;

        error_details_el
            .insert(
                new Element("button", {
                    "class" : "button secondary",
                    "id"    : "connection-dialog-show-error-details"
                }).update("Show error details"))
            .insert(
                new Element("div", {
                    "id": "connection-dialog-error-details",
                    "style": "display: none"
                }).update(
                    "<p id='connection-dialog-error-details-header'>" +
                        "Error details:</p>" +
                    "<small><p>Status: "  + error.status + " " +
                        error.statusText + "</p>" +
                    "<p>URL: " + request_params.method + " " +
                        request_params.url + "</p>" +
                    "<p>Content type: " + request_params.content_type + "</p>" +
                    "</small>")
            );

        var further_details;

        if (request_params.is_retry && mode === this.MODE_DEFAULT) {
            further_details = "The last retry failed. " +
                "You may continue to retry, but this is probably " +
                "a connectivity issue." +
                "<br><br>Retry again? " +
                "<p id='connection-dialog-error-countdown'></p>";
        }
        else if (can_retry) {
            further_details = "Retry last request? " +
            "<p id='connection-dialog-error-countdown'></p>";
        }
        else {
            further_details = "Reload page and lose all unsaved changes?";
        }

        error_details_el
            .insert(
                 new Element("div", {
                    "id": "connection-dialog-error-further-details"
                 }).update(further_details)
            );

        var retry_handler = bindContext(this, function() {
                console.log("Retrying request");

                $("connection-dialog-error-countdown")
                    .remove();

                $("confirm-collection-yes-button")
                    .stopObserving("click")
                    .removeClassName("primary")
                    .addClassName("disabled")
                    .update("Retrying...");

                this.jsonRequest(
                    request_params.url, request_params.method,
                    request_params.data, request_params.callback,
                    request_params.parse_json, request_params.critical,
                    request_params.content_type,
                    true, request_params.request_id
                );
            }),
            reload_handler = bindContext(this, function() {
                // clear all "before unload" handlers - dialog warns of lost
                // work explicitly
                window.onbeforeunload = undefined;
                window.location.reload(false);
            }),
            ignore_handler = bindContext(this, function() {
                this.connection_alive = true;
                Control.Modal.close();
            });

        this.dialog = showConfirmDialog(
            "Connection error",
            this.MODE_MESSAGES[mode],
            can_retry ? retry_handler : reload_handler,
            ignore_handler,    // close on "Ignore"
            false,
            false,
            can_retry ? "Retry" : "Reload",
            "Dismiss",
            false,   // no auto close
            error_details_el
        );

        // start countdown for auto retry if needed
        if (can_retry) {
            this._countdownAutoRetry(request_params);
        }
        else {
            this.reload_needed = true;
        }

        $("connection-dialog-show-error-details").observe("click", function (event) {
            $("connection-dialog-show-error-details").hide();
            $("connection-dialog-error-details").show();
        });
    },

    /**
     * Tell if the connection error dialog is visible.
     *
     * @returns {boolean}
     * @private
     */
    _dialogVisible : function() {
        "use strict";

        return Control && Control.Modal && Control.Modal.current === this.dialog;
    },

    /**
     * Handle a critical request error.
     *
     * @private
     */
    _criticalRequestError : function(error, response, request_params) {
        "use strict";

        this.connection_alive = false;
        this.last_critical_error = error;

        var dialog_mode = this.MODE_DEFAULT;

        if (this._isSessionInvalid(error, response, request_params)) {
            if (request_params.has_nonce) {
                dialog_mode = this.MODE_RELOAD_ONLY;
                this.need_reload = true;
            }
            else {
                dialog_mode = this.MODE_SESSION_INVALID;
            }
        }

        this.showConnectionLostIndicator();

        if (!this._dialogVisible() || request_params.is_retry) {
            this.showConnectionErrorDialog(error, request_params, dialog_mode);
        }
    },

    /**
     * Tell if the response for the specified request params hints of session
     * timeout / invalid session token.
     *
     * @param {XMLHttpRequest} response
     * @param {Object} request_params
     *
     * @private
     */
    _isSessionInvalid : function(error, response, request_params) {
        "use strict";

        var method = request_params.method.toUpperCase();

        // The servlet responding to any HTTP request after a session timeout
        // is the one responsible for displaying the login page. It has
        // HEAD, GET and POST methods implemented and will respond with 403 in
        // case of a session timeout. Any other method will result in 501
        // response.

        // This, of course might not be 100% accurate - if there are bugs in the
        // backend code this might get it wrong.
        // Also see comments in https://jira.bmc.com/browse/DRUD1-19930

        if (method === "GET" || method === "POST" || method === "HEAD") {
            // 403 Forbidden
            return error.status === 403;
        }
        else {
            // 501 Not Implemented
            return error.status === 501;
        }
    },

    /**
     * Tell if request to the specified URL with specified data uses
     * a nonce token (aka. reqhash / req_hash).
     *
     * We use "req_hash" in URL parameters but "reqhash" (sic!) in POST body
     * parameters for some endpoints (see: std_side_bar_page.mako,
     *                                     visualization_si_creation.js etc.)
     *
     * @private
     */
    _requestHasNonce : function(url, data) {
        "use strict";

        var in_url      = url.indexOf("req_hash=") !== -1,
            // is data a string? if not, it's an Object
            data_string = (typeof data === "string" || data instanceof String);

        return in_url || (data_string ? data.indexOf("reqhash=") !== -1
                                      : (data && data.reqhash !== undefined));
    },

    /**
     * Handle a non-critical request error.
     *
     * @private
     */
    _nonCriticalRequestError : function(error, response, request_params) {
        "use strict";

        // non critical: don't record error details nor mark connection as dead
        this.connection_alive = false;

        this.showConnectionLostIndicator();
    },

    /**
     * Handle a request success.
     *
     * @private
     */
    _requestSuccess : function(request_params) {
        "use strict";

        // We need to check that the request being retried is the same as the
        // one that's just succeeded. We do this to prevent a situation where
        // some other request closes the dialog without executing the automated
        // retry.

        if (this._dialogVisible() &&
                this.retry_request_id === request_params.request_id) {

            this.retry_request_id = undefined;
            this.last_critical_error = undefined;

            Control.Modal.close();
        }

        if (!this.need_reload) {
            this.connection_alive = true;
            this.hideConnectionLostIndicator();
        }
    },

    //
    // Countdowns
    //

    /**
     * Start auto-retry countdown.
     *
     * @private
     */
    _countdownAutoRetry : function(request_params) {
        "use strict";

        if (this._dialogVisible()) {
            // start countdown
            this.auto_retry_countdown = this.auto_retry_seconds + 1;
            this.retry_request_id = request_params.request_id;

            this._autoRetryCountdownTick(request_params.request_id);
        }
    },

    /**
     * Handle a single tick of auto-retry timer. Calls self every 1s until
     * the countdown value reaches 0.
     *
     * If request_id is not the current request being retried, does nothing.
     *
     * @private
     */
    _autoRetryCountdownTick : function(request_id) {
        "use strict";

        var countdown_p = $("connection-dialog-error-countdown");

        if (!this._dialogVisible() || !countdown_p ||
                request_id !== this.retry_request_id) {
            return;
        }

        this.auto_retry_countdown -= 1;

        countdown_p.update(
            "Auto-retry in " + this.auto_retry_countdown +
            (this.auto_retry_countdown === 1 ? " second..." : " seconds...")
        );

        if (this.auto_retry_countdown === 0) {
            countdown_p.update("Auto-retrying...");
            $("confirm-collection-yes-button").simulate("click");
        }
        else {
            setTimeout(
                bindContext(this, this._autoRetryCountdownTick, request_id),
                1000
            );
        }
    }
});

// Create global client
tw.xhr_client = new tw.XHRClient();

/* global d3, bindContext, TWClass, mergeObjects */
/* jshint sub: true, nonew: false, scripturl: true */

// Inline visualization

if (tw === undefined) {
    var tw = {};
}
if (tw.viz === undefined) {
    tw.viz = {};
}


// Mixin for previewing collections
//
tw.viz.PreviewMixIn = TWClass.create({
    preview_viz         : null,  // Object that contains preview visualization instance
    preview_position : null,  // Left, right, top and bottom position of preview window
    is_previewing     : false, // Flag to indicate if the preview window is open

    addPreviewContextMenuItems : function () {
        "use strict";

        this.CONTEXT_MENU_ITEMS["node"] =
            this.CONTEXT_MENU_ITEMS["node"].concat([
                [
                    bindContext(this, function (datum, target) {

                        if (datum.collection_type !== undefined) {
                            return "Preview collection";
                        }
                        else {
                            return undefined;
                        }
                    }),
                    bindContext(this, function () {
                        return !this.is_previewing;
                    }),
                    bindContext(this, this._handlePreviewContextMenuAction)
                ]
            ]);
    },

    _handlePreviewContextMenuAction : function (datum, target) {
        "use strict";

        // Get position of the target collection node relative to the viewport
        this.preview_position = target.node().getBoundingClientRect();

        this.is_previewing = true;

        if (this.preview_viz) {
            // preview window exists - replace previous state
            this._removePreviousState();

            this.loadMembers(datum, bindContext(this, function (datum, data) {
                this.openPreviewWindow(datum, data);
                this._dismissPreviewOnClickOutside();
            }));
        }
        else {
            // preview window does not exist - create it
            this.loadMembers(datum, bindContext(this, function (datum, data) {
                this.preview_viz = tw.viz.previewViz(data, datum, this);
                this._dismissPreviewOnClickOutside();
            }));
        }

        this.highlightTargetNode(target);
    },

    // Load nodes and links of a given collection.
    //
    // The callback is always called asynchronously.
    //
    loadMembers : function (d, callback) {
        "use strict";

        if (this.collectionMembersLoaded(d)) {
            // members have been loaded before - don't load anything
            var member_lookup = this._getMemberLookup(d.members),
                objref        = this;

            // Call the callback in pseudo-asynchronous way (to be on par with
            // the case when collection members are not loaded).
            setTimeout(function () {
                callback(d, {
                    // assume all the data needed for preview is already
                    // in the visualization
                    nodes: member_lookup,
                    links: objref._getCollectionLinks([], member_lookup)
                });
            }, 0);

            return;
        }

        tw.xhr_client.jsonPostForm(this.options.expand_collection_api_url, {
            adding_node_ids : Object.toJSON(d.members),
            expanding_group : true
        }, bindContext(this, function (error, node_data) {
            if (error) {
                return;
            }

            var member_lookup  = this._getMemberLookup(d.members),
                col_nodes      = this._getCollectionNodes(node_data.nodes,
                                                          member_lookup, d);

            callback(d, {
                // Merge already existing nodes in member_lookup
                // and newly loaded nodes.

                nodes : mergeObjects(member_lookup, col_nodes),
                links : this._getCollectionLinks(node_data.links, member_lookup)
            });

            // Store the expanded members' data in visualization and mark the
            // collection as having members loaded.
            this._handleData({ nodes: col_nodes, links: [] }, d);
            this.markCollectionMembersLoaded(d);
        }));
    },

    // Open preview visualization.
    // Calling when preview is already initialized
    //
    openPreviewWindow : function (datum, data) {
        "use strict";
        var viz = this.preview_viz;

        viz.in_div.style("display", "block");
        viz.enabled = true;
        this._setPreviewWindowPosition();

        viz.setVizState(data);

        viz.preview_data = data;
        viz.preview_collection = datum;

        if (datum.expandable) {
            viz._constructExpandButton();
        }
    },

    // Set the preview window position under collection node
    //
    _setPreviewWindowPosition : function () {
        "use strict";
        var viz = this.preview_viz,
            pos = this.preview_position;

        viz.in_div
            .style("top", pos.top + pos.height + "px")
            .style('left', pos.left + pos.width + "px");
    },

    // Clean up preview visualisation before showing new preview collection
    _removePreviousState : function () {
        "use strict";
        var viz = this.preview_viz;

        // stop and delete force
        viz.force.stop();
        viz.force.on("tick", undefined);

        // remove all svg elements
        viz.svg.select("g").remove();

        // remove the expand button if it's there (will be re-constructed when
        // the preview window re-opens)
        if (viz.expand_btn) {
            viz.expand_btn.remove();
            viz.expand_btn = null;
        }
    },

    // Dismiss the preview window on mouse click outside of it.
    //
    _dismissPreviewOnClickOutside : function () {
        "use strict";

        var preview_event = d3.event;
        d3.select("body")
            .on("click.openPreview", bindContext(this, function () {
                var target = d3.event.target;

                // Ignore if it the same event which opens the preview window
                if (d3.event === preview_event) {
                    return;
                }

                if (!this.preview_viz.in_div.node().contains(target)) {
                    this.preview_viz._closePreviewWindow();
                }
            }));
    },

    highlightTargetNode : function (target) {
        "use strict";
        target.select('rect, circle')
            .classed("highlighted_preview", true);
    },

    unhighlightTargetNode : function () {
        "use strict";
        d3.select('.highlighted_preview')
            .classed("highlighted_preview", false);
    }
});

// Preview visualization
//
tw.viz.previewViz = function (data, datum, visualization) {
    "use strict";

    var PreviewViz = tw.viz.Visualization.create(
        tw.viz.CollectionsMixIn,
    {
        // Save arguments in props to have possibility to reset it
        // when new collection is previewing
        parent_viz         : visualization,
        preview_data       : data,
        preview_collection : datum,

        expand_btn         : null, // UI element that contain expand collection button

        define_markers     : false,  // whether to construct link marker definitions
                                     // (this is only useful if they are not defined
                                     //  already, in the main visualization)

        // DOM id values for preview viz. to avoid id overlapping
        header_id  : "PreviewVisualizationHeader", // Id for preview top_div
        inner_id   : "PreviewVisualizationInner",  // Id for preview in_div

        is_preview : true, //Flag to indicate if the visualization instance is a preview

        init : function (viz_name, data_id, options, enabled) {
            this._super(viz_name, data_id, options, enabled);
            // overwrite hidden_kinds property with one from parent visualization
            // to avoid hidden kind nodes appear on preview
            this.hidden_kinds = this.parent_viz.hidden_kinds;

            // inherit context_id from parent - required to keep the context
            // (focus mode) sticky
            this.options.context_id = this.parent_viz.options.context_id;

            // now visualization will be displayed with respect to new hidden_kinds
            this.enabled = true;
            this.construct();
            this.start();
        },

        // Request the initial data from the backend.
        //
        _requestInitialData : function () {
            this.setVizState(data);
        },

        // Reset setSmall method to add expand button inn preview viz (if needed)
        //
        setSmall : function () {
            this._super();

            if (datum.expandable) {
                this._constructExpandButton();
            }
        },

        _constructExpandButton : function () {
            this.expand_btn = this.in_div.append('a')
                .text("Expand Collection")
                .attr("href", "javascript:void(0)")
                .attr("class", "preview-visualization-expand-btn")
                .on("click", bindContext(this,
                    this._handleExpandButtonClick));
        },

        _constructTitle : function () {
            // No need to show any focus in the preview so viz title shouldn't
            // be constructed in any specific way, default state is sufficient.
        },

        _handleExpandButtonClick : function () {
            var viz  = this.parent_viz,
                data = this.preview_data,
                d    = this.preview_collection;

            this._closePreviewWindow();


            if (viz._expandCollectionDataCallback) {

                // Add expanded collection member nodes to the main
                // visualization.
                // Use the data callback for normal collection expansion - we
                // got that data in this.preview_data.

                viz._expandCollectionDataCallback.call(viz, d, data, undefined,
                                                       true);
            }
        },

        _closePreviewWindow : function () {
            this.in_div.style("display", "none");
            this.enabled = false;

            this.parent_viz.is_previewing = false;
            this.parent_viz.unhighlightTargetNode();

            // Remove event handler which closed preview window on click on body
            d3.select("body").on(".openPreview", null);
        },

        _addHeaderButtons : function (header) {
            // Let the superclass construct the buttons
            var buttons = this._super(header),
                objref     = this;

            this.expand_btn.attr('style', 'display: none;');

            // Add a close button at the end
            buttons
                .append("button")
                .attr("title", "Close")
                .attr("type", "button")
                .on("click", bindContext(this, this._closePreviewWindow))
                .append("img")
                .attr("alt", "Close")
                .attr("src", this.options.images.x_normal)
                .on("mouseout", function () {
                    this.src = objref.options.images.x_normal;
                })
                .on("mouseover", function () {
                    this.src = objref.options.images.x_hot;
                });
        },

        // Enable showing labels in small screen mode
        showLabels : function () {
            if (!this.showing_labels) {
                this.buildLabels(false, function() {});

                this.showing_labels = true;

                this.startLayout(this.options.layout_iterations.show_labels);
                this.zoom_countdown = 2;
                this.zoom_countdown_2 = 20;
            }
        },

        // Disable saving Visualization options from preview mode
        //
        saveVizOptions : function () {},

        // beforeSetState always returns initial = true, so new preview
        // window replace whole force layout after calling setVizState
        //
        _beforeSetState : function () {
            this.all_links = [];
            this.links_map = {};

            this.all_nodes = [];
            this.nodes_map = {};

            this.has_depth = false;

            return true;
        },

        _defineMarkers : function () {
            // Only create link marker definitions if "define_markers" is set
            // to true. Otherwise, all links will re-use existing definitions.

            if (this.define_markers) {
                this._super();
            }
        }
    });

    var preview_pos = visualization.preview_position;

    // we initialize visualization with "enabled" flag set to false
    // in order to:
    // 1. call _super() in init tpo initialize basic visualization properties
    // 2. than manually update some of properties (like hidden kinds)
    // 3. initiate construct() and start() in order to create visualization with updated properties
    return new PreviewViz("Preview Visualization", "", {
        show_big    : false,
        show_labels : true,
        dynamic     : true,
        small_x     : preview_pos.left + preview_pos.width,
        small_y     : preview_pos.top + preview_pos.height
    }, false);
};

/* global d3, mergeObjects, bindContext, TWClass */
/* jshint sub: true, nonew: false, scripturl: true */

// Inline visualization

if (tw === undefined) {
    var tw = {};
}
if (tw.viz === undefined) {
    tw.viz = {};
}

// Mixin to expand and collapse Collections
//
tw.viz.CollectionsMixIn = TWClass.create({

    LINK_COPY_PREFIX : "004200",

    addCollectionsContextMenuItems : function () {
        "use strict";

        this.CONTEXT_MENU_ITEMS["node"] =
            this.CONTEXT_MENU_ITEMS["node"].concat([
                null,
                [
                     bindContext(this, function (datum, target) {

                        if (datum.collection_type !== undefined) {
                            return "Expand collection";
                        }
                        else if (datum.collection !== "" &&
                                 datum.collection !== undefined) {
                            var cn = this.nodes_map[datum.collection]["short_name"];
                            return "Collapse back into " + cn;
                        }
                        else {
                            return undefined;
                        }
                    }),
                    bindContext(this, function (datum, target) {
                        if (this.collection_members === undefined) {
                            // Don't activate if there are no supporting
                            // maps available.
                            console.log("No collection_members available");
                            return false;
                        }
                        return datum.collection !== undefined &&
                               (datum.expandable || datum.expandable === undefined);
                    }),
                    bindContext(this, this._handleCollectionsContextMenuAction)
                ]
            ]);
    },

    // Handle if the user does an action from the context menu.
    //
    _handleCollectionsContextMenuAction : function (datum, target) {
        "use strict";

        if (this.isCollectionNode(datum)) {
            this.expandCollection(datum);
        }
        else if (this.isCollectionMember(datum)) {
            var collection = this.nodes_map[datum.collection];

            this.collapseCollection(collection);
        }
    },

    // Expand a given collection.
    // Assumes that the collection is collapsed.
    //
    // After initial expanding and AJAX data load for members, the collection
    // datum will gain "_members_loaded" flag. It indicates that there's no
    // need for further AJAX requests, and subsequent expands will be faster.
    //
    // d          - Node data of collection.
    // callback   - optional: Function to call after
    //                        the collection was expanded
    // push_event - optional (defaults to true): whether to issue
    //              EVENT_EXPAND_COLLECTION after the collection has finished
    //              expanding.
    //
    expandCollection : function (d, callback, push_event) {
        "use strict";

        var members = d.members;

        push_event = push_event === undefined ? true : push_event;

        if (!this.collectionMembersLoaded(d)) {
            // Get contents of the collection and their links into the
            // existing graph.

            tw.xhr_client.jsonPostForm(this.options.expand_collection_api_url, {
                adding_node_ids : Object.toJSON(members),
                expanding_group : true,
                grouping_params : this.options.grouping_params
            }, bindContext(this, function (error, data) {
                if (error) {
                    return;
                }

                this._expandCollectionDataCallback(d, data,
                                                   callback, push_event);
            }));
        }
        else {
            // Collection members have been loaded before.
            // Use the same function, but substitute data loaded from the API
            // by data that's already present in visualization state.
            //
            // The _handleDataUpdate function that will be called is able
            // to cope with existing nodes.

            // setTimeout to 0 to make sure that the callback is always called
            // in an uniform way (always asynchronously).
            window.setTimeout(bindContext(this, function () {
                var member_nodes = this._getMemberLookup(d.members),
                    data         = {nodes: member_nodes, links: []};

                this._expandCollectionDataCallback(d, data, callback, push_event);
            }), 0);
        }
    },

    // Expand collection - data callback for XHR requests.
    //
    _expandCollectionDataCallback : function (d, node_data, callback, push_event) {
        "use strict";

        var member_lookup = this._getMemberLookup(d.members);

        // Collection is expanded now and members are loaded
        d.expanded = true;
        this.markCollectionMembersLoaded(d);

        // Add nodes
        node_data.nodes = this._getCollectionNodes(node_data.nodes,
            member_lookup, d);

        // Add the new item to the visualization
        this._handleData(node_data, d, bindContext(this, function () {
            this._setVisibilityFlag(d, true, true); // hide collection node
            this.finishExpandCollection(node_data, d, callback, push_event);
        }));
    },

    // Get members of a specified collection to be restored when restoring
    // a removed collection.
    //
    // This only returns fully loaded nodes (ones that exist in this.all_nodes).
    //
    getCollectionMembersToRestore : function (d) {
        "use strict";

        var all_nodes  = this.all_nodes.concat(
            d3.values(this.removed_nodes)
        );

        return all_nodes.filter(function (node) {
            return node.collection === d.id && node.id !== d.id && node.removed;
        }, this);
    },

    // Get collection members as an array of nodes.
    // For collections that have not been fully loaded, returns an empty array.
    //
    getCollectionMembers : function (d) {
        "use strict";

        var objref = this;

        return d.members
                .map(function (member_id) {
                    return objref.nodes_map[member_id];
                })
                .filter(function (node) {
                    return node !== undefined;
                });
    },

    // Tell if all collection members have been fully loaded.
    // Full load means that they can exist as stand-alone nodes.
    //
    collectionMembersLoaded : function (d) {
        "use strict";

        return d._members_loaded ||
               this.getCollectionMembers(d).length === d.members.length;
    },

    // Go through all the collections and mark them as "fully loaded".
    //
    markAllCollectionsMembersLoaded : function () {
        "use strict";

        this.all_nodes.filter(this.isCollectionNode).forEach(function (col) {
            this.markCollectionMembersLoaded(col);
        }, this);
    },

    // Mark a collection node as fully loaded.
    //
    markCollectionMembersLoaded : function (d) {
        "use strict";

        d._members_loaded = true;
    },

    // Collection-aware node removal - make sure empty collections are removed
    // and that removing a collection removes all its members too.
    //
    _preRemoveNode : function (d) {
        "use strict";

        var is_collection = this.isCollectionNode(d),
            collection    = is_collection ? d : this.nodes_map[d.collection];

        if (collection) {
            // if removing a non-expanded collection
            if (is_collection && !collection.expanded) {

                // go through the collapsed members and mark them as removed
                // (make a copy of collection.members array because we will be
                //  removing members from it)
                [].concat(collection.members).forEach(function (member_id) {
                    var node = this.nodes_map[member_id];

                    if (node) {
                        this.removeMemberFromCollectionNode(node, d);
                        node.removed     = true;
                        node.removed_seq = Date.now();
                    }
                }, this);
            }

            // if removing a collection member
            else if (!is_collection) {
                this.removeMemberFromCollectionNode(d);

                // if this is the last valid member of a collection, mark
                // the collection as removed
                if (collection.members.length === 0) {
                    collection.removed     = true;
                    collection.removed_seq = Date.now();
                }
                else if (collection.visible) {
                    this.redrawCollectionNode(collection);
                }
            }
        }
    },

    // Collection-aware node restore - make sure collections and their members
    // are restored correctly.
    //
    // data_to_restore - object which is being filled by the function.
    // Consists of nodes and links for restoring in one go.
    // Has the following format:
    // {
    //      links : [ <link object> ]
    //      nodes : { <id> : <node object> }
    // }
    //
    _preRestoreNode : function (d, data_to_restore) {
        "use strict";

        var collection        = this.nodes_map[d.collection] ||
                                    this.removed_nodes[d.collection],
            initially_removed = {},
            render_changes    = true;

        if (this.removed_nodes[d.id] !== undefined) {
            // this node is initially removed
            initially_removed[d.id] = d;
        }

        // Restoring a member of a collection
        if (this.isCollectionMember(d)) {
            // Ensure collection is not removed - we'll have at least one
            // valid member
            collection.removed = false;

            if (collection.expanded) {
                // maintain collection linkage and re-add like a normal node
                this.addMemberToCollectionNode(d, collection);

                d.hidden = false;
            }
            else {
                // Setting collection member hidden flag to true
                // if it wasn't set, so it will not appear on view
                d.hidden  = true;
                d.removed      = false;

                this.addMemberToCollectionNode(d, collection);

                if (collection.visible && !this.removed_nodes[collection.id]) {
                    // just re-draw the collection node to update visible member
                    // counts
                    render_changes = false;
                    this.redrawCollectionNode(collection);
                }

                // TODO need proper transition chaining
                // this.animateRedrawCollectionNode(collection);
            }
        }
        // If node which is being restored is a collection -
        // mark all the non-expanded members as not removed
        // and hidden, before restoring the collection node.
        else if (this.isCollectionNode(d)) {
            // if all the collection members have been removed or there
            // are no members in it at all, force collapse & unhide
            // the collection before restoring it
            var members_to_restore = this.getCollectionMembersToRestore(d);

            if ((!d.members.length && members_to_restore.length) ||
                    members_to_restore.length === d.members.length) {
                d.expanded = false;
                d.hidden   = false;
            }

            members_to_restore.forEach(function (node) {
                if (this.removed_nodes[node.id]) {
                    // initially removed member - need to add it to the viz state
                    initially_removed[node.id] = node;
                }

                node.removed = false;
                node.hidden  = true;
                this.addMemberToCollectionNode(node, collection);
            }, this);
        }

        // initially removed nodes - need proper addition to state data structures
        if (d3.keys(initially_removed).length > 0) {
            // include the node we want to restore in initially_removed
            // to make sure it's restored by _handleData
            initially_removed[d.id] = d;

            var node_links = this.all_links.filter(function (link) {
                    return initially_removed[link.src_id] ||
                            initially_removed[link.tgt_id];
                });

            // mark initially removed nodes as not removed before handling the data
            d3.values(initially_removed).forEach(function (node) {
                node.removed = false;
            });

            if(data_to_restore) {
                // We have to use mergeObjects() to prevent missing restoring
                // collection members
                data_to_restore.nodes = mergeObjects(data_to_restore.nodes, initially_removed);
                data_to_restore.links = data_to_restore.links.concat(node_links);
            }
            render_changes = false;
        }

        return render_changes;
    },

    // Check which members exist already
    //
    _getMemberLookup : function (members) {
        "use strict";

        var member_lookup = {};

        members.forEach(function (i) {
            var node = this.nodes_map[i];
            member_lookup[i] = node !== undefined ? node : null;
        }, this);

        return member_lookup;
    },

    // Get all newly expanded nodes of expanding collection
    //
    _getCollectionNodes : function (nodes, member_lookup, d) {
        "use strict";

        var nodes_map = {};

        d3.keys(nodes).forEach(function (id) {

            // Exclude nodes which are not explicitly part of the
            // previewed collection (or the collection itself).

            var res = member_lookup[id];

            if (id !== d.id && res === undefined) {
                // Node is not part of group
                return;
            }
            else if (res) {
                // Node is already there
                res.hidden = false;
            }

            var item = nodes[id];

            // Ensure item is in the expanded collection
            item["collection"] = d.id;
            nodes_map[item.id] = item;

        }, this);

        return nodes_map;
    },

    // Get all links for an expanding collection.
    //
    _getCollectionLinks : function (links, member_lookup) {
        "use strict";

        var collection_links = {};      // link.id -> link

        links.forEach(bindContext(this, function (link) {
            var link_id = link.id || this._buildLinkId(link.src_id, link.tgt_id);

            collection_links[link_id] = link;
        }));

        // go through all the links and add those that are relevant to the
        // collection
        this.all_links.forEach(function (link) {
            if (member_lookup[link.src_id] !== undefined &&
                    member_lookup[link.tgt_id] !== undefined) {
                collection_links[link.id] = link;
            }
        });

        return d3.values(collection_links);
    },

    // Add inter-collection links in as-needed basis.
    //
    // This is because the backend only sends links leading from/to real data
    // store nodes and collections are "virtual".
    //
    // - collections_map - should map member ids to their parent collection ids
    //                     {"member_id": "collection_id", ...}
    //
    _addCollectionLinks : function (collections_map, all_links, links_map) {
        "use strict";

        if (all_links === undefined) {
            all_links = this.all_links;
        }

        if (links_map === undefined) {
            links_map = this.links_map;
        }

        var prefix = this.LINK_COPY_PREFIX;

        var add_link = function (link, link_data) {
            var link_id = prefix + link_data.src_id + link_data.tgt_id;

            if (links_map[link_id]) {
                return;
            }

            var data = mergeObjects({
                fake: link.fake,
                kind: link.kind,
                removed: link.removed,
                style: link.style,

                rel_id: link.rel_id,
                id: link_id
            }, link_data);

            all_links.push(data);
            links_map[link_id] = data;
        };

        [].concat(this.all_links).forEach(function (link) {

            var src_id  = collections_map[link.src_id] ?
                            collections_map[link.src_id] : link.src_id,

                tgt_id  = collections_map[link.tgt_id] ?
                            collections_map[link.tgt_id] : link.tgt_id;

            if (src_id !== link.src_id) {
                add_link(link, {
                    src_id: src_id,
                    tgt_id: link.tgt_id
                });
            }

            if (tgt_id !== link.tgt_id) {
                add_link(link, {
                    src_id: link.src_id,
                    tgt_id: tgt_id
                });
            }

            if (tgt_id !== link.tgt_id && src_id !== link.src_id) {
                add_link(link, {
                    src_id: src_id,
                    tgt_id: tgt_id
                });
            }
        }, this);
    },

    // Callback function to _handleData
    // Push expand event to undo/redo pump and highlight nodes here
    //
    // "data" optional argument is used to pass additional data along with
    // EVENT_EXPAND_COLLECTION. If it's non-null, should be an object
    // containing "nodes" and "links" attributes.
    //
    finishExpandCollection : function (data, d, callback, push_event) {
        "use strict";

        var objref       = this,
            do_selection = false,
            added_nodes  = this.node_sel.filter(function (vd) {
                if (vd.id === d.id) {
                    do_selection = d3.select(this).select("circle, rect")
                        .classed("selected");
                }
                return d.members.indexOf(vd.id) !== -1 || vd.id === d.id;
            });

        // Highlight all newly added items

        if (this.highlightNode !== undefined) {
            added_nodes.each(function (vd) {
                if (vd.id !== d.id) {
                    objref.highlightNode(this, vd.collection, true);

                    // Select all newly added items if the collection
                    // was selected
                    if (do_selection &&
                        objref._handleNodeSelection !== undefined) {
                        objref._handleNodeSelection(this, true);
                    }
                }
            });
        }

        if (push_event && this.pushEvent !== undefined) {
            var member_lookup = this._getMemberLookup(d.members),
                event_data    = {
                    collection : d,
                    undone     : false,
                    undo       : this._handleUndoExpandCollection,
                    redo       : this._handleUndoCollapseCollection
                };

            if (data) {
                // collection expansion can happen without data
                event_data.links = data.links;
                event_data.nodes = mergeObjects(member_lookup, data.nodes);
            }

            this.pushEvent(this.EVENT_EXPAND_COLLECTION, event_data);
        }

        if (callback !== undefined) {
            callback();
        }
    },

    // Recalculate collection member count when adding or restoring member node
    //
    addMemberToCollectionNode : function (item, collection) {
        "use strict";

        if (!this.isCollectionMember(item)) {
            console.log("Trying to add a non-member to a collection");
            return;
        }

        if (collection === undefined) {
            collection = this.nodes_map[item.collection] ||
                this.removed_nodes[item.collection];
        }

        // if member exists in the collection already - don't add it
        if (collection.members.indexOf(item.id) !== -1) {
            return;
        }

        collection.members.push(item.id);
        collection.members_short_name.push(item.short_name);

        if (collection.member_kinds[item.kind]) {
            collection.member_kinds[item.kind] += 1;
        }
        else {
            collection.member_kinds[item.kind] = 1;
        }

        // check for RulesMixIn
        if (this.sharedPostAddMemberToCollectionNode) {
            this.sharedPostAddMemberToCollectionNode(item, collection);
        }
    },

    // Remove a collection member from its parent collection.
    //
    removeMemberFromCollectionNode : function (item, collection) {
        "use strict";

        if (!this.isCollectionMember(item)) {
            console.log("Trying to remove a non-member from a collection");
            return;
        }

        if (collection === undefined) {
            collection = this.nodes_map[item.collection];
        }

        // if member doesn't exists in the collection - don't remove it
        var item_index = collection.members.indexOf(item.id);

        if (item_index === -1) {
            return;
        }

        collection.members.splice(item_index, 1);
        collection.members_short_name.splice(item_index, 1);

        if (collection.member_kinds[item.kind]) {
            collection.member_kinds[item.kind] -= 1;
        }

        if (collection.member_kinds[item.kind] === 0) {
            delete collection.member_kinds[item.kind];
        }

        // check for RulesMixIn
        if (this.sharedPostRemoveMemberFromCollectionNode) {
            this.sharedPostRemoveMemberFromCollectionNode(item, collection);
        }
    },

    // Recalculate members to update collection node icon accordingly
    //
    _recalculateCollectionMembers : function (collection) {
        "use strict";

        // If there are members that are not in this.nodes_map, assume that
        // some members have just been added (or haven't been loaded yet)
        // and don't reset member_kinds.
        var add_only     = collection.members.some(function (member_id) {
                return this.nodes_map[member_id] === undefined;
            }, this),
            member_kinds = add_only ? collection.member_kinds : {},
            members;

        members = collection.members.filter(function (member_id) {
            var item = this.nodes_map[member_id];

            if (item === undefined) {
                // not fully loaded member, but still a valid one
                return true;
            }

            if (item.removed) {
                return false;
            }

            if (member_kinds[item.kind]) {
                member_kinds[item.kind] += 1;
            }
            else {
                member_kinds[item.kind] = 1;
            }

            return true;
        }, this);

        collection.members            = members;
        collection.member_kinds       = member_kinds;

        // check for RulesMixIn
        if (this._sharedPostRecalculateCollectionMembers) {
            this._sharedPostRecalculateCollectionMembers(collection);
        }
    },

    // Redraw a collection node if the number of its members has changed
    //
    redrawCollectionNode : function (collection) {
        "use strict";

        var col_node = this.node_sel.filter(function (item) {
            return collection.id === item.id;
        });

        if (col_node.empty()) {
            // nothing to redraw, the collection node does not exist (yet)
            return;
        }

        // Clear all child nodes inside collection element before reconstructing
        col_node.selectAll("*").remove();

        this._constructCollectionNodeFromSVGShape(collection, col_node);
    },

    // Animate the redraw of collection
    //
    animateRedrawCollectionNode : function (collection) {
        "use strict";

        var col_node = this.node_sel.filter(function (item) {
            return collection.id === item.id;
        });

        if (col_node.empty()) {
            // nothing to redraw, the collection node does not exist (yet)
            return;
        }

        // adding .split(' scale')[0] to prevent extra scaling
        // if user clicks restore button again before animation has been done
        var col_transform = col_node.attr('transform').split(' scale')[0];

        // Make simple pulsing animation to highlight the collection node
        col_node.transition()
            .attr("transform", col_transform + " scale(1.5, 1.5)")
            .duration(200)
            .each("end",function() {
                d3.select(this)
                    .transition()
                    .attr("transform", col_transform)
                    .duration(200);
            });
    },

    // Collapse a collection node.
    //
    // Assumes that the collection is expanded.
    //
    collapseCollection : function (datum, callback, push_event) {
        "use strict";

        var collection = this.nodes_map[datum.id],
            nodes      = {};
            push_event = push_event === undefined ? true : push_event;

        collection.members.forEach(function (node_id) {
            if (this.nodes_map[node_id] !== undefined) {
                nodes[node_id] = this.nodes_map[node_id];
            }
        }, this);

        collection.x = datum.x;
        collection.y = datum.y;
        collection.expanded = false;

        this._setVisibilityFlag(d3.values(nodes), true, true); // hide collection members
        this._setVisibilityFlag(collection, false, true); // show collection node

        this.refreshLayout(bindContext(this, function() {
            if (callback !== undefined) {
                callback();
            }
        }));

        // Push event to event pump

        if (push_event && this.pushEvent !== undefined) {
            this.pushEvent(this.EVENT_COLLAPSE_COLLECTION, {
                collection : collection,
                nodes      : nodes,
                undone     : false,
                undo       : this._handleUndoCollapseCollection,
                redo       : this._handleUndoExpandCollection
            });
        }
    },

    // Undo expand collection or redo collapse collection
    _handleUndoExpandCollection : function (data) {
        "use strict";

        // collapse the collection but don't push event
        this.collapseCollection(data.collection, undefined, false);

        return true;
    },

    // Undo collapse collection or redo expand collection
    _handleUndoCollapseCollection : function (data) {
        "use strict";

        // expand the collection but don't push event
        this.expandCollection(data.collection, undefined, false);

        return true;
    },

    // Tell if the given node data object is a collection or not.
    //
    // WARNING: this is used all over the codebase to test for collections
    //          support (because we have no other mechanisms to test for mixins)
    //          Take extra care when touching this in any way.
    //
    isCollectionNode : function (n) {
        "use strict";

        return n.members !== undefined;
    },

    // Tell if the given node data object is a collection member or not.
    // A collection member might be a collection too.
    //
    isCollectionMember : function (n) {
        "use strict";

        return n.collection;
    },

    // Tell if all member kinds have been hidden by the user.
    // If so, the collection should not be visible.
    //
    collectionMemberKindsHidden : function (n) {
        "use strict";

        return d3.keys(n.member_kinds).every(function (kind) {
            return this.hidden_kinds[kind];
        }, this);
    },

    // State persistence
    //

    // Add "collections" state key to overall visualization state.
    // This handles both expanded and collapsed collections, also member nodes
    // for collapsed collections.
    //
    // Expanded collection members are handled separately, as ordinary nodes,
    // and then enriched by _getVizStateForExpandedMember.
    //
    addCollectionsVizState : function (state) {
        "use strict";

        // This assumes that collection nodes have not been added
        // as ordinary nodes to the state object.
        //
        // We need to add the "collections" key and collection membership
        // information to existing nodes (collection_id property).
        state["collections"] = {};

        this.all_nodes.forEach(bindContext(this, function (node) {

            if (!this.isCollectionNode(node)) {
                // we don't care about non-collection nodes
                return;
            }

            var collection_state = {};

            if (!this._getVizStateForCollection(node, collection_state, state)) {
                return;
            }

            state["collections"][node.id] = collection_state;
        }));
    },

    // Get collection-aware visualization state for node.
    // A node must be an ordinary node, not a collection.
    //
    _getVizStateForExpandedMember : function (n, state) {
        "use strict";

        // TODO shared

        // not a member of a collection or an expanded member
        state["expanded"] = false;

        if (n.collection) {
            // Member of a collection. This is treated as an ordinary node,
            // the only difference being the presence of additional collection
            // attributes. This must be passed to the backend, because
            // collections are not standalone entities in the data store.
            state["collection_id"] = n.collection;

            var collection_node = this.nodes_map[n.collection] ||
                                    this.removed_nodes[n.collection],
                col_extra_data  = this._getCollectionExtraData(collection_node);

            state["collection_name"]       = collection_node.collection_name;
            state["collection_short_name"] = collection_node.short_name;
            state["collection_type"]       = collection_node.collection_type;
            state["collection_removed"]    = collection_node.removed;

            state["expandable"]            = collection_node.expandable;
            state["expanded"]              = collection_node.expanded;

            // TODO need to persist this in data store
            state["primary_member"]        = collection_node.primary_member;

            state["collection_extra_data"] = col_extra_data;
        }

        return true;
    },

    // Get visualization state for collection node.
    // This takes the overall visualization state as 3rd argument
    // and might modify it by adding collapsed members to "nodes" state.
    //
    _getVizStateForCollection : function (collection_node, state, viz_state) {
        "use strict";

        // TODO shared

        if (collection_node.replaced) {
            // replaced means that this collection is no longer valid
            // for serialization, although it is not explicitly removed
            return false;
        }

        this._getVizStateForNode(collection_node, state);

        state["collection_name"]       = collection_node.collection_name;
        state["collection_short_name"] = collection_node.short_name;

        state["members"]         = collection_node.members;
        state["member_kinds"]    = collection_node.member_kinds;

        state["collection_type"] = collection_node.collection_type;
        state["expandable"]      = collection_node.expandable;
        state["expanded"]        = collection_node.expanded;

        // TODO need to persist this in data store
        state["primary_member"]  = collection_node.primary_member;

        // overwrite extra_data with collection-specific extra data
        state["extra_data"]      = this._getCollectionExtraData(collection_node);

        if (!collection_node.expanded) {

            // Add collapsed member nodes to be a part of "nodes" state
            collection_node.members.forEach(function (member_id, index) {
                viz_state["nodes"][member_id] = (
                    this._getVizStateForCollapsedMember(
                        collection_node, member_id, index
                    )
                );
            }, this);

            // Because _getVizStateForLink doesn't know anything about
            // collections, it will mark some links incorrectly as removed
            // (collapsed members are not in this.nodes_map).
            if (collection_node.removed !== true) {

                viz_state["links"].forEach(function (link_state) {
                    var is_member_link = (
                        state.members.indexOf(link_state.src_id) !== -1 ||
                        state.members.indexOf(link_state.tgt_id) !== -1
                    );

                    if (is_member_link && link_state.removed) {
                        // keep removed links state consistent
                        //
                        // If another link with the same rel_id is removed
                        // then keep this one removed too, otherwise mark it as
                        // not removed.
                        //
                        // Multiple links with the same rel_id are logically
                        // the same links, but are doubled for visualizations
                        // because of collections and their member expansion.

                        link_state.removed = this.all_links.some(function (link) {
                            return (link.rel_id === link_state.rel_id &&
                                        (link.src_id !== link_state.src_id ||
                                         link.tgt_id !== link_state.tgt_id) &&
                                    link.removed);
                        });
                    }
                }, this);
            }
        }

        return true;
    },

    // Get data for collapsed collection members.
    //
    _getVizStateForCollapsedMember : function (collection_node, member_id,
                                               index) {
        "use strict";

        // TODO shared

        // treat this node as removed if it has been explicitly removed
        // by the user, or its collection has been removed
        var node         = this.nodes_map[member_id] || this.removed_nodes[member_id],
            node_removed = node === undefined ? false : node.removed;

        return {
            "collection_id"         : collection_node.id,
            "removed"               : node_removed || collection_node.removed,

            "collection_name"       : collection_node.collection_name,
            "collection_short_name" : collection_node.short_name,
            "collection_type"       : collection_node.collection_type,
            "collection_removed"    : collection_node.removed,
            "expandable"            : collection_node.expandable,
            "expanded"              : false,

            // TODO need to persist this in data store
            "primary_member"        : collection_node.primary_member,

            "extra_data"            : {
                "x"           : collection_node.x,
                "y"           : collection_node.y,
                "removed_seq" : collection_node.removed_seq,

                // This member is collapsed, so it is not visible.
                // This flag will be respected when the data is loaded back.
                "visible"     : false
            },

            "collection_extra_data" : this._getCollectionExtraData(collection_node)
        };
    },

    // Get extra data for a collection node, to be included with its every
    // member as "collection_extra_data".
    //
    // This is because we have no way of storing collection nodes in the data
    // store as of 19.05.2016.
    //
    _getCollectionExtraData : function (collection) {
        "use strict";

        return {
            // TODO rename "visible" flag to "hidden"
            // (that's what it really is and should ever be)
            // "visible" is too generic and misleading.
            //
            // "hidden" is only used for hiding expanded collections, etc.
            //
            // Also, when hiding nodes with the show/hide menu, node.
            // will be set to false (this shouldn't not persisted though).
            "visible"        : !collection.hidden,
            "x"              : collection.x,
            "y"              : collection.y,
            "removed_seq"    : collection.removed_seq
        };
    }
});

/* global autocloser, d3, bindContext, TWClass, $, Autocompleter,
   encodeHTML, messageBoardRaise, messageBoardClose, Class, RenameManager,
   showConfirmDialog */

/* jshint sub: true, nonew: false, scripturl: true */

if (tw === undefined) {
    var tw = {};
}
if (tw.viz === undefined) {
    tw.viz = {};
}

// Application modelling editor mixin.
//
tw.viz.AppModellingMixin = TWClass.create({

    EVENT_HANDLER_APPLICATION_MODELLING_EDITOR : "collect_for_app_modelling_handler",

    app_mod_editor_mode : false,     // Flag if we are in the App Modelling Editor

    layout_changes      : false,     // Flag if layout changes are pending

    app_name            : undefined, // The application model name
    app_properties      : undefined, // The application model properties

    app_clone_id        : "",        // Clone id if we are viewing a published app model
                                     // which has pending changes
    app_source_id       : "",        // Source id if we are viewing an edit clone of a
                                     // published app model
    app_bai_id          : "",        // BAI id for published models
    app_published       : false,     // Flag to indicate if the model is published

    model_menu_ul       : undefined, // Ul element of the model menu
    model_modal         : undefined, // Modal dialog for "Model Application"

    _app_name_exist     : false,     // Flag if application name already exists in system

    all_model_defs      : {},        // All model definition names in datastore
    foreign_model_defs  : {},        // All model definition names except the current
                                     // model and its source.

    FILTER_UNPUBLISHED  : "unpublished",
    FILTER_PUBLISHED    : "published",

    // Add application modelling specific context menues.
    //
    addAppModellingContextMenuItems : function () {
        "use strict";

        if (this.countSelected === undefined) {
            console.log("Internal Error: Can't add application model " +
                        "context menu items without selection mixin");
            return;
        }
    },

    // Removal should be disallowed for models needing attention in view mode.
    //
    allowNodeRemoval : function () {
        "use strict";

        return !(this.options.app_needs_attention && !this.app_mod_editor_mode);
    },


    // Entries for the sidebar menu which are exclusive for the editor.
    //
    addAppModellingEditorSideBarMenuItems : function () {
        "use strict";

        this.SIDE_BAR_MENU_ITEMS.push(bindContext(this, function () {
            return this.options.view_mode ? [] : [
                true,
                this.options.images.appmodeprop,
                "Attributes",
                bindContext(this, this._showAppModellingAttributesSidebar)
            ];
        }));
    },

    // Define extra SVG shapes in "defs" SVG element, so that they can be
    // referenced using the <use> tag.
    //
    _defineMarkersAppModelling : function () {
        "use strict";

        // define extra icons
        var icon = this.svg.append("defs")
            .append("g")
            .attr("id", "icon-review-suggested")
            .attr("transform", tw.viz.WARNING_ICON.transform);

        icon.append("polygon")
            .attr("points", tw.viz.WARNING_ICON.bg_polygon_points);

        icon.append("path")
            .attr("d", tw.viz.WARNING_ICON.path);
    },

    // Start modelling an application
    //
    _startModelling : function () {
        "use strict";

        this.app_start_modelling = true;

        this.app_name       = "";
        this.app_properties = {
            description : "",
            type        : "",
            version     : ""
        };

        this.closeSideBarExtendPanel();

        this.toggleVisualizationViewMode();
        this.editMode();

        // Reset the sidebar

        this.SIDE_BAR_MENU_ITEMS = [];

        // Wrap items for the export sidebar to include
        // the app model export.

        var origfunc = this._showExportSidebar;
        this._showExportSidebar = bindContext(this, function () {
            this._showAppModellingExportSidebar.apply(this, arguments);
            origfunc.apply(this, arguments);
        });

        // Add all side bar items again

        this.addSideBarMenuItems();

        // Show sidebar for App Modelling Editor mode

        this.updateSideBarMenu();

        // Hide "Save Changes" button, as changes will be saved together with model
        if (this.save_changes_button) {
            this.save_changes_button.style({ display: "none" });
        }
    },

    // Switch from view mode to edit mode.
    //
    switchToEditMode : function () {
        "use strict";

        this.toggleVisualizationViewMode();

        // All the calls end in a redirect so we can disable the header controls here

        this._disableHeaderControls();

        if (!this.app_published) {

            // For an unpublished model do a page refresh and start
            // again in edit mode

            // Delete hash / anchor part, if it exists in the current URL
            var href     = window.location.href,
                hash_idx = href.lastIndexOf("#");

            if (hash_idx !== -1) {
                // slice off everything that comes after # and the # itself
                href = href.slice(0, hash_idx);
            }

            //Commented below line because of issue reported in Fortify scan & the method is currentnly not in used, if needed in future below line needs to be uncommented.
            //window.location = href + "&app_edit=1";

            // TODO: After the beta we should NOT do a page refresh
            //       and just call this.editMode()
            //       All the changes should be kept however we
            //       need to highlight to the user if some
            //       significant changes have been kept.
            //    -> inspect undo event queue for SIGNIFICANT_CHANGE_EVENTS
        }
        else {

            // TODO: Instead of discarding all pending changes we should present
            // a dialog choice: keep pending changes (discard current changes)
            // or overwrite pending changes with current changes.

            if (this.app_source_id !== "") {
                // This MD is a clone so just edit it directly
                this._navigateToModel(this.app_source_id, true);

            }
            else if (this.app_clone_id !== "") {
                // This MD already has a clone so continue editing that
                this._navigateToModel(this.app_clone_id, true);

            }
            else {
                this.showSpinner();

                tw.xhr_client.jsonRequest(
                    this.options.model_definitions_api_url +
                        "?source_for_edit=" + this.data_id +
                        "&req_hash=" + this.options.nonce_token,
                    "POST",
                    "{}",

                    bindContext(this, function (error, data) {
                        if (!error) {
                            // Redirect to the cloned ModelDefinition node. We need to do
                            // a redirect here so we can present a model with removed BAI.

                            this._navigateToModel(data.id, true);
                            sessionStorage.highlight_model = this.app_name;
                        }
                        else {
                            this.hideSpinner();
                        }
                    })
                );
            }
        }
    },

    // Entries for the sidebar menu which are only used for the Inline Visualization.
    //
    addAppModellingInlineVizSideBarMenuItems : function () {
        "use strict";

        if (this.app_mod_editor_mode) {

            // This is for the case when we started an application model
            // and the Inline Visualization changes to be the Application Model Editor.

            this.addAppModellingEditorSideBarMenuItems();

        }
        else {
            var objref = this;

            this.SIDE_BAR_MENU_ITEMS.push(function() {
                if (!objref.options.app_modelling_enabled ||
                    !objref.options.app_edit_permission) {

                    var tooltip;

                    if (!objref.options.app_edit_permission) {
                        tooltip = 'You do not have permission to create application models';
                    }
                    else {
                        tooltip = "Application modeling is only available in Software-Connected focus";
                    }

                    return [
                        false,
                        objref.options.images.appmodmodel_dis,
                        "Model",
                        undefined,
                        { 'tooltip' : tooltip, 
                          'disabled' : true,
                          'alt' : 'Icon indicating that application modelling may not be started' }
                    ];

                }
                else {
                    return [
                        true,
                        objref.options.images.appmodmodel,
                        "Model",
                        bindContext(objref, objref._showAppModellingModelSidebar),
                        { 'tooltip' : 'Start Application Modeling',
                          'alt' : 'Icon indicating that application modelling may be started'
                        }
                    ];
                }
            });
        }
    },

    // Add export of application models to the sidebar.
    //
    _showAppModellingExportSidebar : function (sidebar_div) {
        "use strict";

        // Are the app modelling features actually enabled?
        if (!this.options.app_modelling_enabled) {
            return;
        }

        this.createSideBarButton(sidebar_div,
            this.options.images.modelexport,
            "Export Model Definition",
            bindContext(this, this.exportModelDefinition)
        );
    },

    // Show the properties form which lets you edit the properties
    // of the application model.
    //
    _showAppModellingAttributesSidebar : function (sidebar_div) {
        "use strict";

        var button_div,
            button,
            count = 1;

        if (this.countSelected === undefined) {
            console.log("Internal Error: Can't show application model " +
                        "sidebar without selection mixin");
            return;
        }

        // Are the app modelling features actually enabled?

        if (!this.options.app_modelling_enabled) {
            return;
        }

        // Using QueryBuilder ajax interface to get kind attributes
        // for Autocompleter

        if (this._bai_attribute_data === undefined) {

            this._bai_attribute_data = [];

            d3.select("body").insert("div")
                .classed("autocomplete", true)
                .attr("id", "app_mod_known_attributes")
                .style("display", "none");

            tw.xhr_client.jsonPostForm('AjaxQueryBuilder', {
                action: 'attributes',
                _tw_search_id           : -1,
                kind                    : "BusinessApplicationInstance",
                includeHiddenAttributes : false,
                includeUnusedAttributes : true
            }, bindContext(this, function (error, data) {
                if (error) {
                    return;
                }

                data.attributes.forEach(function (item) {
                    this._bai_attribute_data.push(item.name);
                }, this);

            }));
        }

        // Create table element and define a function to add fixed form elements

        var table = sidebar_div.append("table")
                .classed("vis-sidebar-new-model-container", true),
            add_fixed_form_element = bindContext(this,
                function (name, label, placeholder, element) {

                    var form  = table.append("tr"),
                        field = "model_app_field"+ count++;

                    if (element === undefined) {
                        element = "input";
                    }

                    label = label.escapeHTML();

                    form.append("td")
                        .append("label")
                        .attr("for", field)
                        .html(label);

                    var val_input = form.append("td")
                        .append(element)
                        .attr("class", "prop-input prop-fix-value")
                        .attr("placeholder", placeholder === undefined ? "" : placeholder)
                        .attr("name", name)
                        .attr("type", "text")
                        .on("focus", bindContext(this, function() {
                            this.keyboard_input = true;
                        }))
                        .on("blur", bindContext(this, function() {
                            this.keyboard_input = false;
                        }));

                    val_input.node().value = this.app_properties[name];
                });

        // Add fixed form elements

        add_fixed_form_element("description", "Description", undefined, "textarea");

        add_fixed_form_element("type", "Type", "Defaults to name");

        add_fixed_form_element("version", "Version", "Version of the Application");

        // Define a function to add custom form elements

        var add_cust_form_element = bindContext(this, function (label, value, placeholder1, placeholder2) {
                var opt_form = table.insert("tr", ":nth-child(" + count + ")"),
                    field = "model_app_field"+ count++;

                label = label.escapeHTML();

                opt_form.append("td")
                    .classed("prop-row", true)
                    .append("input")
                    .attr("class", "prop-input prop-key")
                    .attr("name", field + "_key")
                    .attr("id", field + "_key")
                    .attr("type", "text")
                    .attr("value", label)
                    .attr("placeholder", placeholder1 !== undefined ? placeholder1 : "")
                    .on("focus", bindContext(this, function() {
                        this.keyboard_input = true;
                    }))
                    .on("blur", bindContext(this, function() {
                        this.keyboard_input = false;
                    }));

                var val_td = opt_form.append("td")
                        .classed("prop-row", true),
                    val_input = val_td
                        .append("input")
                        .attr("class", "prop-input prop-value")
                        .attr("name", field + "_value")
                        .attr("type", "text")
                        .attr("placeholder", placeholder2 !== undefined ? placeholder2 : "")
                        .on("focus", bindContext(this, function() {
                            this.keyboard_input = true;
                        }))
                        .on("blur", bindContext(this, function() {
                            this.keyboard_input = false;
                        })),
                    a = val_td.append("a")
                        .classed("prop-remove", true)
                        .attr("title", "Remove attribute")
                        .attr("alt", "Remove attribute")
                        .attr("href", "javascript:void(0)");

                a.append("img")
                    .attr("src", this.options.images.x_normal);

                a.on("click", function () {
                    d3.event.preventDefault();
                    window.setTimeout(function () {
                        opt_form.html("");
                    }, 10);
                });

                if (value) {
                    val_input.node().value = value;
                }

                new Autocompleter.Local(field + "_key",
                                        'app_mod_known_attributes',
                                        this._bai_attribute_data, { });
            });

        // Add custom elements

        d3.keys(this.app_properties).forEach(function (item) {
            if (["type", "version", "description"].indexOf(item) === -1) {
                add_cust_form_element(item, this.app_properties[item],
                                      "Attribute Name", "Attribute Value");
            }
        }, this);

        // Add buttons

        button_div = table.append("tr").append("td")
            .attr("colspan", "2")
            .append("div");

        button = button_div
            .append("button")
            .attr("class", "button primary app-model-control-button")
            .attr("type", "button")
            .text("Add Attribute");

        button.on("click", bindContext(this, function () {
            d3.event.preventDefault();
            add_cust_form_element("", undefined,
                                  "Attribute Name", "Attribute Value");
        }));

        button = button_div
            .append("button")
            .attr("class", "button primary app-model-control-button")
            .attr("type", "button")
            .text("OK");

        button.on("click", bindContext(this, function () {
            d3.event.preventDefault();

            // Try to update the app properties

            try {
                if (this._updateAttributes(table)) {
                    this.pending_changes = true;
                    this._updatePendingChangesMarker();
                }
            } catch(e) {
                return;
            }

            this.closeSideBarExtendPanel();
        }));

        button = button_div
            .append("button")
            .attr("class", "button primary app-model-control-button")
            .attr("type", "button")
            .text("Cancel");

        button.on("click", bindContext(this, function () {
            d3.event.preventDefault();
            this.closeSideBarExtendPanel();
        }));
    },

    // Check the properties form and update the datastructure.
    //
    _updateAttributes : function (table) {
        "use strict";

        var RESERVED_ATTRIBUTES = [ "key" ],
            key, value, key_element,
            errors = false,
            ret = false,
            keys = [],
            UpdateException = function (msg, tooltip) {
                this.msg      = msg;
                this.tooltip  = tooltip;
            },
            update = bindContext(this, function (key, value) {

                if (key === '') {
                    throw new UpdateException("Enter a name", "Please enter a name");
                }
                else if (RESERVED_ATTRIBUTES.indexOf(key) !== -1) {
                    throw new UpdateException("Reserved attribute", "The attribute name is a reserved name");
                }
                else if (!key.match(/^[a-zA-Z].*$/)) {
                    throw new UpdateException("Invalid name", "The attribute name must start with a letter");
                }
                else if (!key.match(/^[a-zA-Z][a-zA-Z0-9_]*$/)) {
                    throw new UpdateException("Invalid name", "The attribute name can only contain alphanumerical characters and underscores");
                }

                var old_val = this.app_properties[key];
                keys.push(key);
                if (old_val !== value) {
                    this.app_properties[key] = value;
                    ret = true;
                }
            });

        // Update keys

        table.selectAll(".errorMsg").remove();

        table.selectAll("input.prop-input, textarea.prop-input").each(function (item) {
            var element = d3.select(this);

            if (element.classed("prop-fix-value")) {
                key   = element.attr("name");
                value = this.value;

                update(key, value);
            }
            else if (element.classed("prop-key")) {
                key         = this.value;
                key_element = this;
            }
            else if (element.classed("prop-value")) {
                value = this.value;

                try {
                    update(key, value);
                } catch (e) {
                    var parent = d3.select(key_element.parentNode);

                    parent.append("div")
                        .classed("errorMsg", true)
                        .attr("title", e.tooltip)
                        .attr("alt", e.tooltip)
                        .text(e.msg);

                    errors = true;
                }
            }
        });

        if (errors) {
            throw("Attribute errors");
        }

        // Remove keys

        d3.keys(this.app_properties).forEach(function (item) {
            if (keys.indexOf(item) === -1) {
                delete this.app_properties[item];
                ret = true;
            }
        }, this);

        return ret;
    },

    // Show the application sidebar extension which lets you either
    // start a new application model or adds the current model
    // to an existing application model.
    //
    _showAppModellingModelSidebar : function (sidebar_div, mouseover) {
        "use strict";

        if (this.countSelected === undefined) {
            console.log("Internal Error: Can't show application model " +
                        "sidebar without selection mixin");
            return;
        }

        // Are the app modelling features actually enabled?
        if (!this.options.app_modelling_enabled) {
            return;
        }

        var nodes_selected = this.countSelected() > 0,
            tabs = [];

        tabs.push({
            label: "Start New" + (nodes_selected ? "<br/>(from Selection)": ""),
            build_tab_body: bindContext(this, function (tab_body) {

                // Create the submit form

                tab_body.append("p").text(nodes_selected ?
                                          "You can create a new Application Model containing the selected nodes." :
                                          "You can create a new Application Model containing all the nodes displayed in this visualization. To create a model containing only some of the nodes, first use Select Mode to select the nodes you require.");

                var button = tab_body.append("p")
                    .classed("calButtons", true)
                    .append("button")
                    .attr("class", "button primary")
                    .text("Create New Application Model");

                // Check the form and start the process

                button.on("click", bindContext(this, function () {
                    d3.event.preventDefault();

                    // Prevent multiple submissions

                    button[0][0].disable();

                    if (nodes_selected) {
                        this.keepSelected();
                    }

                    this._startModelling();
                }));
            })
        });

        tabs.push({
            label: "Add To Existing" + (nodes_selected ? "<br/>(from Selection)": ""),
            build_tab_body: bindContext(this, function (tab_body) {

                var select_model_text = tab_body.append("div");

                select_model_text.classed("vis-sidebar-tab-block", true);

                select_model_text.append("h3").text("Select Model");
                select_model_text.append("p").text(nodes_selected ?
                                                   "You can add the selected nodes to an existing Application Model." :
                                                   "You can add all the nodes displayed in this visualization to an existing Application Model. To add only some of the nodes, first use Select Mode to select the nodes you require.");

                tw.xhr_client.jsonRequest(
                    this.options.model_definitions_api_url,
                    "GET",
                    "",
                    bindContext(this, function (error, data) {
                        if (error) {
                            return;
                        }

                        if (data.length === 0) {
                            this.createSideBarTabButton(tab_body,
                                "No application models found.", "", undefined, true);
                            return;
                        }

                        var model_filter = tab_body.append("div"),
                            model_filter_tbl = model_filter.append("table")
                                            .attr("class", "vis-sidebar-new-model-container"),
                            model_filter_tbl_row = model_filter_tbl.append("tr");

                        model_filter.classed("vis-sidebar-tab-block", true);

                        model_filter_tbl_row
                            .append("td")
                            .append("label")
                            .attr("for", "filter_app_models")
                            .text('Filter');

                        var filter_text = model_filter_tbl_row
                            .append("td")
                            .append("input")
                            .attr("class", "prop-input")
                            .attr("name", "filter_app_models")
                            .attr("type", "text")
                            .on("focus", bindContext(this, function() {
                                this.keyboard_input = true;
                            }))
                            .on("blur", bindContext(this, function() {
                                this.keyboard_input = false;
                            }))
                            .on("keyup", bindContext(this, function () {
                                var app_models = this.filterAppModels(data, filter_text.node().value, fav_checkbox.node().checked, published_checkbox.node().checked, published_dropdown.node().value);
                                this.buildAppModelsList(app_models, tab_body, nodes_selected);
                            }));

                        // add extra row containing 'Show only favorites' checkbox
                        model_filter_tbl_row = model_filter_tbl.append("tr");
                        var model_filter_tbl_col = model_filter_tbl_row.append("td")
                            .attr("colspan", "2");

                        var fav_checkbox = model_filter_tbl_col
                            .append("input")
                            .attr("id", "model_filter_favorites_checkbox")
                            .attr("type", "checkbox")
                            .attr("checked", "checked")
                            .on("click", bindContext(this, function() {
                                var app_models = this.filterAppModels(data, filter_text.node().value, fav_checkbox.node().checked, published_checkbox.node().checked, published_dropdown.node().value);
                                this.buildAppModelsList(app_models, tab_body, nodes_selected);
                            }));

                        model_filter_tbl_col
                            .append("label")
                            .attr("for", "model_filter_favorites_checkbox")
                            .text('Only show favorites');

                        // add row for the filter on published state controls
                        model_filter_tbl_row = model_filter_tbl.append("tr");
                        model_filter_tbl_col = model_filter_tbl_row.append("td")
                            .attr("colspan", "2");

                        var published_checkbox = model_filter_tbl_col
                            .append("input")
                            .attr("id", "model_filter_published_checkbox")
                            .attr("type", "checkbox")
                            .on("click", bindContext(this, function() {
                                published_dropdown.node().disabled = !published_checkbox.node().checked;
                                var app_models = this.filterAppModels(data, filter_text.node().value, fav_checkbox.node().checked, published_checkbox.node().checked, published_dropdown.node().value);
                                this.buildAppModelsList(app_models, tab_body, nodes_selected);
                            }));

                        model_filter_tbl_col
                            .append("label")
                            .attr("for", "model_filter_published_checkbox")
                            .text('Filter To');

                        var published_dropdown = model_filter_tbl_col
                            .append("select")
                            .attr("name", "model_filter_published_dropdown")
                            .attr("disabled", "disabled")
                            .on("change", bindContext(this, function() {
                                var app_models = this.filterAppModels(data, filter_text.node().value, fav_checkbox.node().checked, published_checkbox.node().checked, published_dropdown.node().value);
                                this.buildAppModelsList(app_models, tab_body, nodes_selected);
                            }));

                        published_dropdown
                            .append("option")
                            .attr("value", this.FILTER_UNPUBLISHED)
                            .attr("selected", "selected")
                            .text("Unpublished");

                        published_dropdown
                            .append("option")
                            .attr("value", this.FILTER_PUBLISHED)
                            .text("Published");

                        var app_models = this.filterAppModels(data, '', true, false, this.FILTER_UNPUBLISHED);
                        this.buildAppModelsList(app_models, tab_body, nodes_selected);

                        this.focusFirstSideBarTextInput();
                    })
                );
            })
        });

        var divs = this.createSideBarTabs(sidebar_div, tabs);

        tw.xhr_client.jsonGet(
            this.options.model_definitions_api_url,
            bindContext(this, function (error, data) {
                if (!error) {
                    divs[1].classed("disabled", data.length === 0);
                }
            })
        );
    },

    // Loop over application models and return only those which match the filter
    // criteria specified by the user.
    //
    filterAppModels: function(model_defs, filter_text, favorites, published, published_status) {
        "use strict";

        var app_models = [];

        if (filter_text || favorites || published) {

            // Encode the filter text so it matches on encoded characters correctly

            if (filter_text) {
                filter_text = encodeHTML(filter_text);
            }

            model_defs.forEach(bindContext(this, function (model) {

                // Copy model, so as to preserve its contents.

                var model_copy = Object.clone(model);

                // Make sure the model name is encoded.

                model_copy.name = encodeHTML(model.name);

                // We need to preserve the unencoded version as well so we can use it for title attributes.

                model_copy.orig_name = model.name;

                if ((!favorites || model_copy.favorite) &&
                    (!published ||
                     (published_status === this.FILTER_UNPUBLISHED && !model_copy.published) ||
                     (published_status === this.FILTER_PUBLISHED && model_copy.published)))
                {
                    if (filter_text) {

                        // The searching is done on lowercase versions of the strings so it is case insensitive.
                        // However the output text is constructed based on the original string so as to maintain the
                        // capitalization.  We convert to lower case outside of the search loop so we're not doing it on
                        // every iteration.  The downside of this is it makes constructing the output_text a little more
                        // involved.

                        filter_text = filter_text.toLowerCase();

                        var name_text = model_copy.name.toLowerCase(),
                            output_text = '',
                            offs = 0, // offset within the original string indicating the current start point of the search
                            idx; // index of found text or -1 if not found

                        while ((idx = name_text.indexOf(filter_text)) !== -1) {

                            // Append to the output text the original string from the current offset to the end of the
                            // found text with the found text emboldened.

                            output_text += model_copy.name.substr(offs, idx) + '<b>' + model_copy.name.substr(offs + idx, filter_text.length) + '</b>';

                            // Remove the front of the string so the next search starts after the previously found text.

                            name_text = name_text.substr(idx + filter_text.length);

                            // Set the offset to match the position in the original string corresponding to the
                            // beginning of name_text.

                            offs += idx + filter_text.length;
                        }

                        // Only push if output_text is set to something as that
                        // means the filter_text was found at least once.

                        if (output_text) {

                            // output_text only contains up to and including the final
                            // match of filter_text.  Therefore we still need to add
                            // on the remainder of the text, the offset of which is
                            // conveniently still in offs.

                            model_copy.name = output_text + model_copy.name.substr(offs);
                            app_models.push(model_copy);
                        }
                    }
                    else {

                        app_models.push(model_copy);
                    }
                }
            }));
        }
        else {

            model_defs.forEach(function (model) {
                var model_copy = Object.clone(model);

                // Make sure the model name is encoded.

                model_copy.name = encodeHTML(model.name);

                // We need to preserve the unencoded version as well so we can use it for title attributes.

                model_copy.orig_name = model.name;

                app_models.push(model_copy);
            });
        }

        return app_models;
    },

    buildAppModelsList: function (app_models, tab_body, nodes_selected) {
        "use strict";

        tab_body.selectAll(".vis-sidebar-menu-list-item").remove();

        app_models.forEach(function (item) {
            var button = this.createSideBarTabButton(
                tab_body,
                item.name,
                item.orig_name, // Need to use the orig name for the title attribute so d3 can encode it
                bindContext(this, function () {
                    if (nodes_selected) {
                        this.addToAppModelFromSelection(item.id);
                    }
                    else {
                        this.addToAppModel(item.id);
                    }
                }));

            button.select("div").classed("app-model-name", true);

            if (item.favorite) {
                button.append("img")
                    .attr("src", this.options.images.favorite);
            }
            button
                .append("span")
                .text(item.published ? "Published" : "Unpublished");
        }, this);
    },

    // Initialise this function to allow saving of an existing or
    // a newly created model using the keyboard shortcut Ctrl + S
    saveAppModelOnKeypress : function() {
        "use strict";

        // Check if we are actually in edit mode
        if (this.options.view_mode) {
            return;
        }

        d3.select("body").on("keydown.save", bindContext(this, function() {
            var e = d3.event;

            // 83 is 'S'
            if (e.ctrlKey && e.keyCode === 83) {
                if (this.app_start_modelling) {
                    if (this.app_name !== "") {
                        this.createAppModel();
                    }
                    // For the special case that there is no appname defined yet,
                    // but the user has typed one in.
                    // app_name_first_edit is handled in _updateAppModelPageHeader
                    else if (this.app_name_first_edit) {
                        this.app_name = this.app_name_first_edit;
                        this.createAppModel();
                    }
                    else {
                        messageBoardRaise("Please enter a name to create the model.", "No Name Specified", true, true);
                        window.setTimeout(function () {
                                messageBoardClose();
                        }, 10000);
                    }
                }
                else if (this.pending_changes || this.layout_changes) {
                    this.saveAppModel();
                }
                e.preventDefault();
            }
        }));
    },

    // Callback function which should be called when we save or publish
    // an existing model.
    //
    // "publish" can be a boolean to change the published state, or undefined if
    // the published state should be left unaltered.
    saveAppModel : function (publish) {
        "use strict";

        var hidden_orphans = this._getHiddenOrphans();

        this.closeSideBarExtendPanel();

        autocloser.forceClose();

        if (publish !== undefined) {
            var action   = publish ? 'publish' : 'unpublish',
                callback = bindContext(this, function () {
                    // remove the orphans first (we should warn the user)
                    this.removeNode(hidden_orphans);

                    var ret = this._requestSaveAppModel(publish);
                    if (publish !== undefined && ret) {
                        // When we publish or un-publish we do a page refresh so disable the header controls

                        this._disableHeaderControls();
                    }
                    sessionStorage.highlight_model = this.app_name;
                });

            if (hidden_orphans.length) {
                this.showConfirmDialogForHiddenOrphans(action, hidden_orphans,
                                                       callback);
            }
            else {
                showConfirmDialog(
                    "Confirm " + action,
                    "Are you sure you wish to save all changes and " + action + " this application?",
                    callback
                );
            }
        }
        else {
            if (hidden_orphans.length) {
                var save_callback = bindContext(this, function () {
                    this.removeNode(hidden_orphans);

                    this._requestSaveAppModel(publish);
                });

                this.showConfirmDialogForHiddenOrphans("save", hidden_orphans,
                                                       save_callback);
            }
            else {
                this._requestSaveAppModel(publish);
            }
        }

    },

    // Update all components which need to know if there are pending changes.
    //
    _updatePendingChangesMarker : function (highlight) {
        "use strict";

        this._updateAppModelPageHeader();

        if (highlight) {
            this._highlightBannerActiveStep();
        }
    },

    // Enter view mode.
    //
    viewMode : function () {
        "use strict";

        // Change the page header to indicate view mode

        this._updateAppModelPageHeader();

        // Go "inline screen"

        this._forceInlineScreen();

        // Set document title

        document.title = document.title.replace(
            /(BMC Discovery: ).+( \(.+\))/,
            "$1Application Model: " + this.app_name + "$2"
        );
    },

    // Enter edit mode.
    //
    editMode : function (push_history_state) {
        "use strict";

        var LAYOUT_CHANGE_EVENTS = [
            this.EVENT_LAYOUT_CHANGE,
            this.EVENT_NODE_DRAG
        ];

        if (!this.options.enable_editing) {
            return false;
        }

        // Change the page header to indicate edit mode

        this._updateAppModelPageHeader();

        // Go "full screen"

        this._forceFullScreen();

        if (this.app_mod_editor_mode) {
            return true;
        }
        else {
            this.app_mod_editor_mode = true;
        }

        // Tab into event system and listen for changes which should be saved

        if (this.subscribeEventHandler !== undefined) {
            this.subscribeEventHandler(
                this.EVENT_HANDLER_APPLICATION_MODELLING_EDITOR,
                [ "*" ],
                bindContext(this, function (event_name, data) {

                    // Ignore undo / redo events

                    if ((event_name === this.EVENT_UNDO ||
                         event_name === this.EVENT_REDO)) {

                        return ;
                    }

                    // Only set pending changes if the event was a significant change

                    if (LAYOUT_CHANGE_EVENTS.indexOf(event_name) !== -1) {
                        this.layout_changes = true;
                        this._updatePendingChangesMarker();
                    }
                })
            );
        }

        this.update_side_bar_listeners.push(bindContext(this, function () {
            this._updatePendingChangesMarker(this.options.highlight_model);
        }));

        // Remove glow around origin ("root") node(s)

        this.disableRootNodesHighlight();

        // Set document title

        document.title = document.title.replace(
            /(BMC Discovery: ).+( \(.+\))/,
            "$1Application Model: " + this.app_name + "$2"
        );
    },

    // Tell if we are dealing with a published model or its clone
    // (source id exists).
    //
    _publishedOrClone : function () {
        "use strict";

        return this.app_published || this.app_source_id !== "";
    },

    // Update the page header title to indicate edit mode.
    //
    _updateAppModelPageHeader : function () {
        "use strict";

        var header = d3.select("h2.pageMainTitle"),
            header_controls;

        // If the header does not exist - create it.
        // This occurs for search visualizations with multiple nodes
        // that include a custom header and a query builder element.

        if (!header.node() || header.node().parentNode.id === "debug") {
            header = d3.select("div#content1")
                .insert("h2", ":first-child")   // insert as very first child
                .attr("class", "pageMainTitle");
        }

        if (this.header_controls === undefined) {
            var hc = document.createElement('div');
            header.node().parentNode.insertBefore(hc, header.node().nextSibling);
            hc = d3.select(hc).classed("app-model-controls", true);
            this.header_controls = hc;
        }

        header_controls = this.header_controls;
        header_controls.html("");

        if (this.app_modelling_view_header === undefined) {

            // Save the current title as the view page title

            this.app_modelling_view_header = header.html();

            header.html("");

            header.append("div")
                .classed("title-text", true);

            // Load existing model definition names if they are not yet initialized.
            // Note that application_modelling_dashboard.js relies on the all_model_defs being
            // populated in _updateAppModelPageHeader function, so before changing the following
            // request make sure that it won't break the app modelling dashboard.

            tw.xhr_client.jsonGet(
                tw.viz.DEFAULT_OPTIONS.model_definitions_names_url,
                bindContext(this, function (error, data) {
                    if (!error) {
                        data.forEach(bindContext(this, function(model_def) {

                            // All model definition names in datastore
                            this.all_model_defs[model_def.name] = true;

                            // Collect names only if model definition is not itself or its source
                            if (model_def.id !== this.app_source_id && model_def.id !== this.data_id) {
                                this.foreign_model_defs[model_def.name] = true;
                            }
                        }));
                    }
                })
            );

            this._rename_manager = function () {
                new tw.viz.AppModellingRenameManager(
                    this.app_name,
                    "app_name",
                    header.select(".title-text"),
                    {
                        edit_icon      : this.options.images.editicon,
                        edit_icon_hover: this.options.images.editicon_hover
                    },
                    bindContext(this, function(new_name) {

                        this.app_name        = new_name;
                        this.pending_changes = true;

                        // Need to delay the update a bit so that other
                        // event handler can fire.

                        window.setTimeout(bindContext(this, function () {

                            // When this flag is set the user pressed on the submit button
                            // and will submit the form - no need to update anything from here

                            if (this.app_name_first_edit_submission) {
                                return;
                            }

                            // This is to mitigate some Chrome issue where the
                            // header.html("") call of _updateAppModelPageHeader
                            // doesn't delete the contents in some instances.

                            header.html("");

                            this._updatePendingChangesMarker();

                        }), 200);
                    }),
                    bindContext(this, function(update_value) {

                        // Check if model definition with the same name exists
                        this._toggleAppModelNameMessage(update_value);

                        // Special case when we start typing in the beginning
                        // and there is no app name defined just yet.

                        if (this.app_name === "") {

                            this.app_name_first_edit = update_value;

                            // Save Changes button is either enabled or disabled
                            // depending whether or not the user typed something in

                            var save_button = this.header_controls.selectAll("input[value='Save']," +
                                                  " input[value='Save & Publish']");

                            if (update_value === "") {

                                save_button.attr("title", "Please provide a model name")
                                           .attr("alt", "Please provide a model name")
                                           .attr("disabled", true)
                                           .on("click.first_edit", null);

                            }
                            else if (save_button.attr("disabled")) {

                                save_button.attr("title", "Save Changes")
                                      .attr("alt", "Save Changes")
                                      .attr("disabled", null);

                                var objref = this;

                                save_button.on("click.first_edit", function () {

                                    var element = d3.select(this);

                                    // App name should be there by now since the focus of the input
                                    // field was lost

                                    if (objref.app_name === "") {

                                        // If there is no app name give whatever we have now

                                        objref.app_name = objref.app_name_first_edit;
                                    }

                                    objref.app_name_first_edit_submission = true;

                                    objref.createAppModel(element.attr("value") === "Save & Publish");
                                });
                            }
                        }
                    }),
                    bindContext(this, this._toggleAppModelNameMessage, this.app_name)
                );

                // Create HTML elements for warning implementation

                var warning_name_exist = d3.select(".app-name-message")
                    .style("display", "none");

                var warning_info = warning_name_exist.append("span")
                    .classed("testWarning", true)
                    .classed("app-name-warning", true)
                    .attr("title", "A Model Definition with the same name already exists.");

                warning_info.append("img")
                    .attr("src", this.options.images.warning_normal)
                    .attr("alt", "Warning");

                warning_info.append("span").text(" Already in use (");

                warning_info.append("a")
                    .attr("target", "_blank")
                    .attr("rel", "noopener noreferrer")
                    .attr("href", this._buildAppModelNameSearchUrl(this.app_name))
                    // When losing focus from application model name input by clicking on a link,
                    // Rename.js that controls focus does onBlur callback and link redirect does
                    // not happen. It's because Rename.js "collapses" the input so the link
                    // is on new position after that and click actually doesn't fire.
                    // Using of "onmousedown" hook allows to overcome this problem
                    // but some browsers don't allow open link in new tab by "onmousedown"
                    // and block this as "unwanted pop-up". Using additional flag
                    // between "mousedown" and "mouseup" pauses input collapsing and makes
                    // possible to click on link.
                    .on("mousedown", function() {
                        tw.viz._rename.app_name.obj.can_blur = false;
                    })
                    .on("mouseup", function() {
                        tw.viz._rename.app_name.obj.can_blur = true;
                        // Need to call "focus_lost()" manually since input is already
                        // not focused but uncollapsed yet.
                        tw.viz._rename.app_name.obj.focus_lost();
                    })
                    .text("View");

                warning_info.append("span").text(")");

                this._toggleAppModelNameMessage(this.app_name);
            };

            this.app_modelling_edit_header = header.html();
        }

        header.html("");

        var create_button = function(label, secondary, item) {
            var btn = item !== undefined ? item.insert("input") :
                                           header_controls.insert("input");

            return btn.classed("btn btn--xxs", true)
                .attr("type", "button")
                .attr("title", secondary ? secondary : label)
                .attr("aria-label", secondary ? secondary : label)
                .attr("value", label);
        };
        var get_active_item = function(parent) {
            return parent.select("div[class*=active]");
        };

        // Adding state specific images and buttons

        var button, active_item;
        if (this.options.view_mode) {
            header.html(this.app_modelling_view_header);

            if (this._publishedOrClone()) {
                if (this.app_source_id !== "") {
                    this._constructBanner(header_controls, {
                        i1_name    : "Model",
                        i1_tooltip : this.APP_MODEL_BANNER_TOOLTIPS.MODEL,
                        i1_active  : false,
                        i1_done    : true,
                        i2_name    : "Published",
                        i2_tooltip : this.APP_MODEL_BANNER_TOOLTIPS.PUBLISHED,
                        i2_active  : false,
                        i2_done    : true,
                        i3_name    : "Revision",
                        i3_tooltip : this.APP_MODEL_BANNER_TOOLTIPS.REVISION,
                        i3_active  : true,
                        i3_warned  : this.options.app_needs_attention
                    });
                }
                else if (this.app_clone_id !== "") {
                    this._constructBanner(header_controls, {
                        i1_name    : "Model",
                        i1_tooltip : this.APP_MODEL_BANNER_TOOLTIPS.MODEL,
                        i1_active  : false,
                        i1_done    : true,
                        i2_name    : "Published",
                        i2_tooltip : this.APP_MODEL_BANNER_TOOLTIPS.PUBLISHED,
                        i2_active  : false,
                        i2_done    : true,
                        i3_name    : "Revision",
                        i3_tooltip : this.APP_MODEL_BANNER_TOOLTIPS.REVISION,
                        i3_active  : true,
                        i3_warned  : this.options.app_needs_attention
                    });
                }
                else {
                    this._constructBanner(header_controls, {
                        i1_name    : "Model",
                        i1_tooltip : this.APP_MODEL_BANNER_TOOLTIPS.MODEL,
                        i1_active  : false,
                        i1_done    : true,
                        i2_name    : "Published",
                        i2_tooltip : this.APP_MODEL_BANNER_TOOLTIPS.PUBLISHED,
                        i2_active  : true,
                        i2_warned  : this.options.app_needs_attention,
                        i3_name    : "No Revision",
                        i3_active  : false
                    });
                }
            }
            else {
                this._constructBanner(header_controls, {
                    i1_name    : "Model",
                    i1_tooltip : this.APP_MODEL_BANNER_TOOLTIPS.MODEL,
                    i1_active  : true,
                    i1_warned  : this.options.app_needs_attention,
                    i2_name    : "Not Published",
                    i2_tooltip : this.APP_MODEL_BANNER_TOOLTIPS.NOT_PUBLISHED,
                    i2_active  : false,
                    i3_name    : "No Revision",
                    i3_active  : false
                });
            }

            active_item = get_active_item(header_controls);

            var published = this._publishedOrClone(),
                show_re_evaluate = (published && this.options.app_publish_permission) ||
                                   (!published && this.options.app_edit_permission);

            if (this.options.app_edit_permission) {

                // Adding edit controls
                if (this.options.app_needs_attention && show_re_evaluate) {
                    button = create_button(
                        "Review",
                        "Review changes to the application model",
                        active_item
                    );
                }
                else if (this.app_published && this.app_clone_id === "") {
                    button = create_button(
                        "Revise Model",
                        "Create revision for the published application model",
                        active_item
                    );
                }
                else {
                    button = create_button(
                        "Edit",
                        this.app_published ? "Edit revision of published application model" : "Edit application model",
                        active_item
                    );
                }
                button.on("click", bindContext(this, this.switchToEditMode, false));
            }
        }
        else {
            header_controls.classed("app-model-controls-edit-mode", true);

            header.html(this.app_modelling_edit_header);

            this._rename_manager();

            if (this.app_source_id !== "") {
                this._constructBanner(header_controls, {
                    i1_name    : "Model",
                    i1_tooltip : this.APP_MODEL_BANNER_TOOLTIPS.MODEL,
                    i1_active  : false,
                    i1_done    : true,
                    i2_name    : "Published",
                    i2_tooltip : this.APP_MODEL_BANNER_TOOLTIPS.PUBLISHED,
                    i2_active  : false,
                    i2_done    : true,
                    i3_name    : "Revising",
                    i3_tooltip : this.APP_MODEL_BANNER_TOOLTIPS.REVISING,
                    i3_active  : true,
                    i3_warned  : this.options.app_needs_attention
                });
            }
            else {
                this._constructBanner(header_controls, {
                    i1_name    : this.app_start_modelling ? "Unsaved Model" : "Model",
                    i1_tooltip : this.APP_MODEL_BANNER_TOOLTIPS.MODEL,
                    i1_active  : true,
                    i1_warned  : this.options.app_needs_attention,
                    i2_name    : "Not Published",
                    i2_tooltip : this.APP_MODEL_BANNER_TOOLTIPS.NOT_PUBLISHED,
                    i2_active  : false,
                    i3_name    : "No Revision",
                    i3_active  : false
                });
            }

            active_item = get_active_item(header_controls);

            // Adding save / cancel / publish controls

            if (this.app_start_modelling) {

                button = create_button(
                    "Save",
                    "Save changes",
                    active_item
                );

                if (this.app_name === "") {
                    button.attr("title", "Please provide a model name")
                           .attr("aria-label", "Please provide a model name")
                           .attr("disabled", true);
                }
                else {
                    button.on("click", bindContext(this, this.createAppModel));
                }
            }
            else {
                if (!this.pending_changes && this.layout_changes) {
                    button = create_button("Save", "Save layout changes", active_item);

                }
                else {
                    button = create_button(
                        "Save",
                        this.pending_changes ? "Save changes": "Nothing to save",
                        active_item
                    );

                    if (!this.pending_changes) {
                        button.attr("disabled", true);
                    }
                }

                if (this.pending_changes || this.layout_changes) {
                    button.on("click", bindContext(this, this.saveAppModel));
                }
            }

            var button_label,
                button_title,
                cancel_changes = function () {
                    this.stopEditing();
                    return;
                };

            if (this.app_start_modelling) {
                button_label = "Discard";
                button_title = "Discard all changes and do not create an application model";
            }
            else if (!this.pending_changes) {
                button_label = "Stop Editing";
                button_title = "Stop editing and go back to view mode";
            }
            else {
                button_label = "Cancel Changes";
                button_title = "Cancel all unsaved changes";
            }
            button = create_button(button_label, button_title, active_item);
            button.on("click", bindContext(this, function () {
                if (this.pending_changes) {
                    showConfirmDialog(
                        button_label,
                        "Are you sure you wish to cancel all unsaved changes?",
                        bindContext(this, cancel_changes)
                    );
                }
                else {
                    cancel_changes.call(this);
                }
            }));

            // Check if we want to add a publish button

            if (this.options.app_publish_permission) {

                if (this.app_start_modelling) {

                    if (this.app_name === "") {
                        button = create_button("Save & Publish", undefined, active_item);
                        button.attr("title", "Please provide a model name")
                               .attr("aria-label", "Please provide a model name")
                               .attr("disabled", true);
                    }
                    else {
                        button = create_button(
                            "Save & Publish",
                            "Save all changes and publish the model as a Business Application Instance",
                            active_item
                        );
                        button.on("click", bindContext(this, this.createAppModel, true));
                    }
                }
                else {

                    if (this._publishedOrClone()) {
                        button = create_button(
                            "Publish",
                            "Save all changes and update the published Business Application Instance",
                            active_item
                        );
                    }
                    else {
                        button = create_button(
                            "Publish",
                            "Save all changes and publish the model as a Business Application Instance",
                            active_item
                        );
                    }
                    button.on("click", bindContext(this, this.saveAppModel, true));
                }
            }

            // Add the ability to save a model using Ctrl + S
            this.saveAppModelOnKeypress();

            if (this.app_start_modelling) {
                return;
            }

            // Add additional actions

            var layout_menu_div = header_controls.insert("div")
                    .classed("actionDropdownHolder app-model-control-button btn-group", true),
                layout_menu_ul,
                add_item = function (label, handler, title, disabled) {
                    var button = layout_menu_ul
                        .append("li")
                        .append("button")
                        .attr("type", "button")
                        .classed("regularAction", true)
                        .text(label);

                    if (disabled === undefined) {
                        button.on("click", handler)
                              .attr("alt", label)
                              .attr("title", title);
                    }
                    else {
                        button.classed("disabled", true)
                              .attr("alt", disabled)
                              .attr("title", disabled);
                    }
                };

            // To attract user's attention to the Re-evaluate option for
            // review suggested model we're placing it up by one layer of the
            // hierarchy in one line with Action menu.
            if (this.applyRules && this.options.app_needs_attention) {
                var warning;

                layout_menu_div
                    .append("button")
                    .attr("class", "btn btn--sm btn--default")
                    .attr("type", "button")
                    .attr("title", "Re-evaluate system-added model contents " +
                        "according to current rules and shared nodes")
                    .text("Re-evaluate")
                    .on("click", bindContext(this, function() {
                        this.pending_changes = true;
                        this.applyRules(undefined, true);
                    }));

                if (this.review_suggested_warning === undefined) {
                    var rs_warning = document.createElement('p');
                    header.node().parentNode.insertBefore(rs_warning, header_controls.node().nextSibling);
                    rs_warning = d3.select(rs_warning).classed("inline-vis-warning flashWarning", true);
                    this.review_suggested_warning = rs_warning;
                }

                warning = this.review_suggested_warning;
                warning.text("Review suggested - ");
                warning.append("button")
                    .attr("class", "btn btn--lg btn--link")
                    .attr("type", "button")
                    .attr("title", "Show advice")
                    .text("advice on common steps to resolve this")
                    .on("click", bindContext(this, function() {
                        this._showReviewSuggestedModelGuidance();
                    }));
            }

            layout_menu_div
                .append("button")
                .attr("id", "actionDropdownLink")
                .attr("class", "btn btn--sm btn--default headerContainer closed")
                .attr("value", "Action")
                .attr("type", "button")
                .attr("onclick", "autocloser.toggleHolder('actionDropdownLink','actionDropdown', true, true);")
                .attr("onmouseover", "javascript:autocloser.toggleOpened('actionDropdownLink','actionDropdown', true);")
                .text("Actions");

            layout_menu_ul = layout_menu_div
                .append("div")
                .attr("id", "actionDropdown")
                .attr("class", "actionDropdownMenu")
                .attr("style", "display:none")
                .append("ul");

            if (this.applyRules && !this.options.app_needs_attention) {
                add_item("Re-evaluate model",
                         bindContext(this, function() {
                             this.pending_changes = true;
                             this.applyRules(undefined, true);
                             autocloser.forceClose();
                         }),
                         "Re-evaluate system-added model contents according to current rules and shared nodes");
            }
            
            if (this.app_source_id !== "") {

                add_item("Delete Model",
                         bindContext(this, this._confirmDeletingAppModel, this.app_source_id, ""),
                         "Delete the application model",
                         (this.options.app_publish_permission ? undefined
                          : "You do not have permission to delete a published model"));

                add_item("Discard All Changes",
                         bindContext(this, this._confirmDeletingAppModel, undefined, undefined),
                         "Discard the current edits, leaving the original model unchanged");

                add_item("Unpublish Model",
                         bindContext(this, this.saveAppModel, false),
                         "Delete the published Business Application Instance, but retain the model definition",
                         (this.options.app_publish_permission ? undefined
                          : "You do not have permission to unpublish a published model"));

            }
            else {
                add_item("Delete Model",
                         bindContext(this, this._confirmDeletingAppModel, undefined, undefined),
                         "Delete the application model");
            }
        }
    },

    _highlightBannerActiveStep: function() {
        "use strict";

        if (!this.options.highlight_model) {
            return;
        }

        d3.select(".inline-vis-state-banner__item--active")
            .classed("inline-vis-state-banner__item--highlighted", true);

        this.options.highlight_model = false;
        sessionStorage.removeItem("highlight_model");
    },

    REVIEW_SUGGESTED_GUIDANCE_STEPS: [
        {
            name  : "One",
            icon   : "<span class=\"vis-guidance-step-img\"></span>",
            text  : "<p>Make sure you can see the nodes that were automatically added by choosing<br>" +
                    "Display > Background shading > Application Model updates.<br>" +
                    "Remove any nodes that should not be included in the model. (Right click on a node and choose \"Remove node\".)</p>",
            next  : "Two"
        },
        {
            name  : "Two",
            icon   : "<svg width='46' height='46'>" +
                        "<g transform='translate(23,23) scale(1.5)'>" +
                            "<circle class='node_bg review-suggested selected' r='10'></circle>" +
                            "<use xmlns:xlink='http://www.w3.org/1999/xlink' xlink:href='#n_SoftwareInstance'></use>" +
                            "<use class='review-suggested' x='-10' y='10' xmlns:xlink='http://www.w3.org/1999/xlink' xlink:href='#icon-review-suggested'></use>" +
                        "</g>" +
                    "</svg>",
            text  : "<p>Highlighted nodes may have further related nodes. Explore them to see what will be added by future maintenance.<br>" +
                    "Hover over a node and choose the blue plus icon " +
                    "<svg width='15' height='18' style='vertical-align: middle'>" +
                        "<text class='nodeRunDiscovery' transform='translate(0,18) scale(2)'>+</text>" +
                    "</svg>" +
                    " to see additional nodes related to it.<br>" +
                    "The Re-evaluate button will show everything related to the highlighted nodes.</p>",
            next  : "Three"
        },
        {
            name  : "Three",
            text  : "<p>During model exploration, remove any newly-found nodes that do not belong in the model.<br>" +
                    "Repeat exploration steps as necessary until the model contains the correct nodes.<br>" +
                    "Once complete, Publish or Save the model to resume automatic maintenance.</p>"
        }
    ],

    _showReviewSuggestedModelGuidance: function() {
        "use strict";

        var tab_item, guidance_tabs, create_tab,
            guidance_body = d3.select(document.createElement("div")),
            guidance_div  = guidance_body.append("div")
                .classed("review-model-guidance", true);

        guidance_div.append("p")
            .text("If it is not obvious how to review the model, try this " +
                   "sequence of recommended steps.");

        guidance_tabs =  guidance_div.append("div")
            .attr("class", "tabHolder tabHolder--noSpaceBefore")
            .insert("ul");

        create_tab = bindContext(this, function(tab) {
            var inner, next_btn;

            guidance_tabs.append("li")
                .classed("current", tab.name === "One")
                .attr("id", "guidanceTab" + tab.name)
                .attr("onclick", "showTab(this, " + "guidanceTabInner" + tab.name + ")")
                .text("Step " + tab.name);

            inner = guidance_div.append("div")
                .classed("tabContentHolder", true)
                .classed("openTab", tab.name === "One")
                .attr("id", "guidanceTabInner" + tab.name)
                .html(tab.text);

            if (tab.icon) {
                inner.insert("div",":first-child")
                    .html(tab.icon);
            }

            next_btn = inner.append("button").attr("type", "button")
                  .attr("class", "btn btn--sm btn--primary btn--solid");

            if (tab.next) {
                next_btn.attr("onclick", "showTab('guidanceTab"+ tab.next +"', 'guidanceTabInner"+ tab.next +"')")
                .text("Next");
            }
            else {
                next_btn.attr("onclick", "tw.viz.visualization.closeKey();")
                .text("Close");
            }
        });

        this.REVIEW_SUGGESTED_GUIDANCE_STEPS.each(function(tab) {
            tab_item = create_tab(tab);
        });

        this.showKey({
            head   : "Review Model",
            body   : guidance_body,
            style  : "top: 65px; left: " + (this.svg_width / 2 - 246) + "px"
        });
    },

    // Show or Hide Message about existence of application model with the same name
    // also when showing a message, updates link url to the page with list of models with same name
    // model_name - string representing application model name that should be verified
    //
    _toggleAppModelNameMessage: function(model_name) {
        "use strict";
        var message_element = d3.select(".app-name-message"),
            message_style   = "none";

        this._app_name_exist = model_name.trim() in this.foreign_model_defs;

        if (this._app_name_exist) {
            message_element.select("a").attr("href", this._buildAppModelNameSearchUrl(model_name));
            message_style = null;
        }

        message_element.style("display", message_style);
    },

    // Based on model_name parameter constructs an ulr to page containing a list of models
    // with same name
    // model_name - string, a name of model
    //
    _buildAppModelNameSearchUrl: function(model_name) {
        "use strict";

        return "/ui/ApplicationSearch?query=" + encodeURIComponent(
                "SEARCH ModelDefinition WHERE name = '" + model_name + "' " +
                "AND state in ['unpublished', 'published']");
    },

    // Disable all header control buttons. This should be
    // called if we have submitted some changes to the backend
    // and await a page redirect.
    //
    _disableHeaderControls : function () {
        "use strict";

        if (this.header_controls !== undefined) {
            this.header_controls.selectAll("button, input")
                .attr("disabled", "1");
        }
    },

    APP_MODEL_BANNER_TOOLTIPS : {
        MODEL         : "Create an initial model of the application using a selection of " +
                        "tools, and by experimenting with layouts until you can see the " +
                        "structure of the application as clearly as possible.",
        NOT_PUBLISHED : "An initial model definition exists, but it has not yet been published " +
                        "as a Business Application Instance node in the system. You can refine " +
                        "the model further until you are ready to publish it.",
        PUBLISHED     : "The model has been finalized. A Business Application Instance node " +
                        "has been created for it.",
        REVISION      : "There are pending changes for this model which have not yet been published.",
        REVISING      : "You are currently revising a copy of the published model. You can save " +
                        "changes to this copy. The changes will only be seen on the application " +
                        "if you publish your changes."
    },

    _constructBanner : function (parent, data) {
        "use strict";

        parent = parent.insert("div")
            .classed("inline-vis-state-banner", true);

        var item,
            make_item = function (text, tooltip, active, done, warned) {
                return parent.append("div")
                    .classed("inline-vis-state-banner__item--active", active)
                    .classed("inline-vis-state-banner__item--done", done)
                    .classed("inline-vis-state-banner__item--warned", warned)
                    .attr("title", tooltip ? tooltip : null)
                    .attr("aria-label", tooltip ? tooltip : null)
                    .text(text);
            };

        item = make_item(data.i1_name, data.i1_tooltip, data.i1_active, data.i1_done, data.i1_warned);
        item.classed("inline-vis-state-banner__item--first", true);

        item = make_item(data.i2_name, data.i2_tooltip, data.i2_active, data.i2_done, data.i2_warned);
        item.classed("inline-vis-state-banner__item--second", true);
        item.insert("div")
            .classed("inline-vis-round-left", true);

        item = make_item(data.i3_name, data.i3_tooltip, data.i3_active, undefined, data.i3_warned);
        item.classed("inline-vis-state-banner__item--third", true);
    },

    // Disable option responsible for root nodes highlight
    // (to prevent highlighting on redrawing, so hiding/showing nodes doesn't
    //  highlight them again) and remove all visible highlights for root nodes.
    //
    disableRootNodesHighlight : function () {
        "use strict";

        this.options.highlight_root = false;
        d3.selectAll(".node_bg.root").classed({"root": false});
    },

    // Return an array of hidden orphaned (disconnected) nodes, if they exist,
    // or an empty array.
    //
    // Such nodes can be created e.g. if a certain node kind gets hidden,
    // and their related nodes (or the links themselves) have been removed.
    //
    _getHiddenOrphans : function () {
        "use strict";

        var hidden_nodes_map   = {},
            hidden_nodes_links = {},
            has_collections    = this.isCollectionNode !== undefined,
            add_link           = function (node_id, link) {
                if (hidden_nodes_links[node_id] === undefined) {
                    hidden_nodes_links[node_id] = [link];
                }
                else {
                    hidden_nodes_links[node_id].push(link);
                }
            };

        // gather hidden nodes
        this.all_nodes.forEach(function (node) {
            var collection_check = true;

            if (has_collections && this.isCollectionNode(node)) {
                collection_check = !node.expanded;
            }

            if (!node.removed && collection_check &&
                (node.hidden || this.hidden_kinds[node.kind])) {
                hidden_nodes_map[node.id] = node;
            }
        }, this);

        if (d3.keys(hidden_nodes_map).length === 0) {
            // no hidden nodes, so no hidden orphans can exist
            return [];
        }

        // A hidden node is orphaned if any of the following are true:
        // - the node didn't have any links in the first place
        // - all the node's links have been removed
        // - all the linked nodes (neighbours) have been removed
        //
        // Here, we only gather links that are valid. After we went through
        // all the links, we might check if any of the hidden nodes don't have
        // valid links in hidden_nodes_map - these are the orphans.

        this.all_links.forEach(function (link) {
            if (link.removed) {
                // not a valid link - continue forEach loop
                return;
            }

            var hidden_source = hidden_nodes_map[link.src_id],
                hidden_target = hidden_nodes_map[link.tgt_id],
                source        = this.nodes_map[link.src_id],
                target        = this.nodes_map[link.tgt_id];

            if (hidden_source && !hidden_source.removed &&
                    target && !target.removed) {
                // valid link leading from a hidden node
                add_link(hidden_source.id, link);
            }

            if (hidden_target && !hidden_target.removed &&
                    source && !source.removed) {
                // valid link leading to a hidden node
                add_link(hidden_target.id, link);
            }
        }, this);

        if (d3.keys(hidden_nodes_links).length === 0) {
            // no links at all - all the hidden nodes are orphans
            return d3.values(hidden_nodes_map);
        }

        // the nodes that have no valid links are our orphans
        return d3.values(hidden_nodes_map).filter(function (node) {
            return hidden_nodes_links[node.id] === undefined;
        });
    },

    // Show a confirmation dialog with a warning mentioning hidden orphaned
    // nodes and their removal.
    //
    // The orphans should be removed by the callback called on confirm.
    //
    showConfirmDialogForHiddenOrphans : function (action_name, hidden_orphans,
                                                  callback) {
        "use strict";

        var verb_plural    = hidden_orphans.length > 1 ? "are"   : "is",
            noun_plural    = hidden_orphans.length > 1 ? "nodes" : "node",
            nodes_warning  = (
                // "Warning: there is / are <n> disconnected node / nodes, that
                // is / are currently hidden and will be removed from the model."
                "Warning: there " + verb_plural + " " + hidden_orphans.length +
                " disconnected " + noun_plural + ", that " + verb_plural +
                " currently hidden and will be removed from the model."
            );

        showConfirmDialog(
            // title (HTML is not escaped)
            "Confirm " + action_name + " &mdash; disconnected " + noun_plural +
            " warning",

            // content (HTML is not escaped)
            nodes_warning + "<br><br>" +
            "Are you sure you wish to save all changes " +
            // (don't mention "save" twice)
            (action_name === "save" ? "" : "and " + action_name + " this application ") +
            "anyway?",

            // callback
            callback
        );
    },

    createAppModel : function (publish, callback) {
        "use strict";

        var hidden_orphans = this._getHiddenOrphans(),
            send_model     = bindContext(this, function () {
                if (hidden_orphans.length) {
                    // remove the orphans first (we should warn the user)
                    this.removeNode(hidden_orphans);
                }

                this._sendAppModel(publish, undefined, undefined, undefined,
                                   callback);
            });

        if (publish === true) {
            if (hidden_orphans.length) {
                this.showConfirmDialogForHiddenOrphans(
                    "publish", hidden_orphans, send_model
                );
            }
            else {
                showConfirmDialog(
                    "Confirm publish",
                    "Are you sure you wish to save all changes and publish this application?",
                    send_model
                );
            }
        }
        else if (hidden_orphans.length) {
            this.showConfirmDialogForHiddenOrphans(
                "create", hidden_orphans, send_model
            );
        }
        else {
            send_model();
        }

        sessionStorage.highlight_model = this.app_name;
    },

    addToAppModel : function (existing_model_id) {
        "use strict";
        this._sendAppModel(false, existing_model_id, undefined, undefined, undefined);
    },

    addToAppModelFromSelection : function (existing_model_id) {
        "use strict";
        this._sendAppModelFromSelection(false, existing_model_id);
    },

    _sendAppModelFromSelection : function (publish, existing_model_id, callback) {
        "use strict";

       var not_selected_nodes = [];

        // Just before sending data, transform it so that non-selected
        // nodes and collections are not included. We transform the data
        // here so we don't have to alter the global state.

        var state_post_processor = bindContext(this, function (viz_state) {
            var selected_ids = this.getSelectedIds();

            d3.keys(viz_state.collections).forEach(function (collection_id) {
                if (selected_ids.indexOf(collection_id) === -1) {

                    // Mark the collection as removed if it's not selected.
                    // Expanded members are handled with other nodes below.

                    viz_state.collections[collection_id].removed = true;
                    not_selected_nodes.push(this.nodes_map[collection_id]);
                }
            }, this);

            d3.keys(viz_state.nodes).forEach(function (node_id) {
                var node_state   = viz_state.nodes[node_id],
                    is_selected  = selected_ids.indexOf(node_id) !== -1,
                    col_member   = !!node_state.collection_id,
                    col_state    = viz_state.collections[node_state.collection_id] || {};

                if (!is_selected &&
                    (!col_member || col_state.expanded || col_state.removed)) {

                    // Mark the node as removed if it's a non-selected
                    // freestanding node or a non-selected member of an expanded
                    // collection.

                    node_state.removed = true;

                    var node = this.nodes_map[node_id];

                    // Some nodes (such as collapsed collections members)
                    // might or might not exist in nodes_map, we need to check
                    // for undefined here.

                    if (node !== undefined) {
                        not_selected_nodes.push(node);
                    }
                }
            }, this);

            return viz_state;
        });

        // When OK has been clicked and a successful response came back from
        // the API, we have an application model created - and it does
        // include not_selected_nodes. Remove them from visualization now.

        var ok_callback = bindContext(this, function (error, response) {
            if (!error) {
                this.removeNode(not_selected_nodes);
                this.selectNone();  // remove all selections
            }
        });

        this._sendAppModel(publish, existing_model_id, ok_callback,
                           state_post_processor, callback);
    },

    // Upload the current visualization state to the backend to create a new
    // model or add to an existing one.
    //
    // "ok_callback", if given, gets called just after the API response arrives.
    // Standard d3 callback arguments for XHR are used: error, response.
    //
    // The "post_process_state_fn" (if given) gets the result of
    // this.getAppModelState and can return a transformed model state object to
    // be sent to the API. By default nothing special is done with the data.
    // This MUST follow the data interchange format. Use with care!
    //
    // The callback function is called after we switched successfully into
    // the Application Model Editor mode.
    //
    // If "publish" is true then the model is created as published.
    // If "published" is anything else the published state is not
    // sent to the backend.
    //
    _sendAppModel : function (publish, existing_model_id, ok_callback,
                              post_process_state_fn, callback) {
        "use strict";

        if (publish !== true) {
            publish = undefined;
        }

        var model_state     = this.getAppModelState(publish, false),
            post_processor  = post_process_state_fn || function (s) {return s;},
            post_processed  = post_processor(model_state),
            json_data       = JSON.stringify(post_processed),
            url;

        if (existing_model_id !== undefined) {
            url = this.options.model_definitions_api_url +
                  "/" + existing_model_id + "/Add" +
                  "?req_hash=" + this.options.nonce_token;
        }
        else {
            url = this.options.model_definitions_api_url +
                  "?req_hash=" + this.options.nonce_token;
        }

        this._disableHeaderControls();
        this.showSpinner();

        tw.xhr_client.jsonRequest(
            url,
            "POST",
            json_data,

            bindContext(this, function (error, data) {
                if (ok_callback) {
                    ok_callback(error, data);
                }

                if (!error) {

                    // Redirect to the ModelDefinition node which
                    // has been created.

                    window.onbeforeunload = undefined;

                    if (this.hasPendingRules && this.hasPendingRules()) {
                        this.updateGlobalRules(bindContext(this, function() {
                            this._navigateToModel(data.id, !publish);
                        }));
                    }
                    else {
                        this._navigateToModel(data.id, !publish);
                    }
                }
                else {
                    this.hideSpinner();
                }
            })
        );
    },

    // Navigate the current browser window to the given ModelDefinition,
    // identified by its node ID.
    //
    // edit : whether to go into editor mode (default: false).
    //
    _navigateToModel : function (model_id, edit) {
        "use strict";

        if (edit) {
            window.location = "/ui/ApplicationView?nodeID=" + model_id + "&app_edit=1";
        }
        else {
            window.location = "/ui/ApplicationView?nodeID=" + model_id;
        }
    },

    // Function to call confirm dialog before deleting app model
    //
    _confirmDeletingAppModel : function (id_to_delete, src_id) {
        "use strict";

        if (src_id === undefined) {
            src_id = this.app_source_id;
        }
        if (id_to_delete === undefined) {
            id_to_delete = this.data_id;
        }

        var confirm_message = src_id === "" ? "Are you sure you wish to delete this Application Model?"
                : "Are you sure you wish to discard all changes?",
            title           = src_id === "" ? "Delete Application Model"
                : "Discard all changes";

        autocloser.forceClose();

        showConfirmDialog(
            title,
            confirm_message,
            bindContext(this, this._deleteAppModel, id_to_delete, src_id)
        );
    },

    // Delete the model.
    //
    _deleteAppModel : function (id_to_delete, src_id) {
        "use strict";

        this._disableHeaderControls();
        this.showSpinner();

        tw.xhr_client.jsonRequest(
            this.options.model_definitions_api_url + "/" + id_to_delete +
                "/Delete" + "?req_hash=" + this.options.nonce_token,
            "POST",
            "",         // empty JSON string

            bindContext(this, function (error, data) {
                if (!error) {
                    window.onbeforeunload = undefined;

                    if (src_id !== "") {
                        this._navigateToModel(src_id, false);
                        sessionStorage.highlight_model = this.app_name;
                    }
                    else {
                        window.location = "/ui/ApplicationModelling";
                    }
                }
                else {
                    this.hideSpinner();
                }
            })
        );
    },

    // Send the request to save the model.
    //
    // "publish" can be a boolean to change the published state, or undefined if
    // the published state should be left unaltered.
    _requestSaveAppModel : function (publish) {
        "use strict";

        // We always send the current state of the model. We also optionally
        // send the publish=True flag to publish or publish=False flag to unpublish.
        // If the publish flag is not sent, the published state is left un-changed in the back-end.

        if (tw.viz.save_app_model_in_progress !== undefined) {
            console.log("Error: App model saving is still in progress");
            return false;
        }
        tw.viz.save_app_model_in_progress = true;

        // Update the pending change marker

        this.pending_changes = false;
        this.layout_changes  = false;
        this._updatePendingChangesMarker();

        this.showSpinner();

        this.sendRequestSaveAppModel(publish);

        return true;
    },

    sendRequestSaveAppModel: function(publish) {
        "use strict";

        tw.xhr_client.jsonRequest(
            this.options.model_definitions_api_url + "/" + this.data_id +
                "?req_hash=" + this.options.nonce_token,
            "PUT",
            this.getAppModelState(publish, true),

            bindContext(this, function (error, data) {

                tw.viz.save_app_model_in_progress = undefined;

                if (!error) {
                    // Update the published flag
                    if (publish !== undefined) {
                        this.app_published = publish;

                        // If we publish or un-publish we need to do a page refresh
                        if (this.app_source_id !== "") {
                            // Do a page refresh to the source ModelDefinition if we have one.
                            window.onbeforeunload = undefined;
                            this._navigateToModel(this.app_source_id, false);
                        }
                        else {
                            // Otherwise do a simple page refresh.
                            //Commented below line because of issue reported in Fortify scan & the method is currentnly not in used, if needed in future below line needs to be uncommented.
                            //window.location = window.location.href.replace("&app_edit=1", "");
                        }
                    }
                    else {
                        // Set the visualization state
                        this.setVizState(data);

                        this.updateSideBarMenu();
                        this.hideSpinner();
                    }
                }
                else {
                    this.pending_changes = true;
                    this._updatePendingChangesMarker();

                    this.hideSpinner();
                }

                if (this.hasPendingRules && this.hasPendingRules()) {
                    this.updateGlobalRules();
                }
            })
        );

        return true;
    },

    // Export the model definition in a form that can be imported into
    // another ADDM instance.
    //
    exportModelDefinition : function () {
        "use strict";

        // Build temporary anchor with a data URI
        var a = document.createElement('a');
        a.href = '/ui/ModelDefinitionDownloadStream?id=' + this.data_id;
        document.body.appendChild(a);

        // Now "click" the link so the user gets the option to
        // save the data
        a.addEventListener("click", function(e) {
            a.parentNode.removeChild(a);
        });
        a.click();
    },

    // Get a JSON-serializable object to use for transmitting the model data
    // to the API.
    //
    // "published" can be a boolean to change the published state, or undefined if
    // the published state should be left unaltered.
    getAppModelState : function (published, as_json) {
        "use strict";

        var viz_state = this.getVizState();

        viz_state.name        = this.app_name;
        viz_state.properties  = this.app_properties;

        if (published !== undefined) {
            viz_state.published = published;
        }

        return as_json ? JSON.stringify(viz_state) : viz_state;
    },

    _noData : function() {
        "use strict";

        if (this.app_name) {
            // when application model is present
            this._setMessage("This application model is empty. To add nodes, find them by searching or browsing the data, then Visualize and choose Model > Add to Existing Model.");
        }
        else {
            // display a generic no data message
            this._noDataGeneric();
        }
    },

    _constructReviewSuggestedIndicator : function (g, d) {
        "use strict";

        // bottom-left corner of the node
        var x = -d.node_icon_width / 2,
            y = this.NODE_SIZE / 2;

        g.append("use")
            .attr("class", "review-suggested")
            .attr("x", x)
            .attr("y", y)
            .attr("xlink:href", "#icon-review-suggested")
            .attr("title", "The system suggests a review of this node.");
    },

    _removeReviewSuggestedIndicators : function () {
        "use strict";

        this.nodes_group.selectAll("use.review-suggested")
            .remove();
    },

    toggleAttentionInfoSection : function () {
        "use strict";

        if (d3.select("#attention-info").style("display") !== "none") {
            d3.select("#attention-info-button")
                .attr("title", "Show more information")
                .html("more info");
            d3.select("#attention-info").style("display", "none");
        }
        else {
            d3.select("#attention-info-button")
                .attr("title", "Hide extra information")
                .html("hide info");
            d3.select("#attention-info").style("display", null);
        }
    },

    // Go back to view mode of source model or BAI from edit mode. If this function is
    // called from view mode, it will do nothing.
    //
    stopEditing : function () {
        "use strict";

        if (this.options.view_mode) {
            return;
        }

        window.onbeforeunload = undefined;
        this._disableHeaderControls();

        if (this.app_source_id !== "") {

            // See if we came from a page which displayed the source MD or BAI

            if (referrerIsFromThisSite(document.referrer) &&
                (document.referrer.indexOf(this.app_source_id) !== -1 ||
                    (this.app_bai_id !== "" && document.referrer.indexOf(this.app_bai_id) !== -1))) {

                // Go back where we came from
                //Commented below line because of issue reported in Fortify scan & the method is currentnly not in used, if needed in future below line needs to be uncommented.
                //window.location = document.referrer;
            }
            else {
                // Don't know where we came from - go back to the source
                this._navigateToModel(this.app_source_id, false);
            }
        }
        else {
            //Commented below line because of issue reported in Fortify scan & the method is currentnly not in used, if needed in future below line needs to be uncommented.
            //window.location = window.location.href.replace(/&app_edit=1/g, "");
        }

    }
});

// Wrapper for our standard RenameManager because the code is ugly
// and uses old-style Prototype classes.
//
tw.viz.AppModellingRenameManager = TWClass.create({

    // Create a new RenameManager
    //
    // label           - Label to display - if empty an input box will be displayed.
    // manager_name    - Unique manager name.
    // component       - Component which should hold the editor.
    // icon_urls       - URLs of icons used in rename manager. Must contain "edit_icon".
    // callback        - Function to call with the new name once it has changed.
    // value_update    - Function to call when typing during edit mode.
    // focus_lost      - Function to call when application name control loses focus.
    //
    init : function(label, manager_name, component, icon_urls, callback, value_update, focus_lost) {
        "use strict";

        // Icon to use for the edit function
        var edit_icon = icon_urls.edit_icon;

        tw.viz._rename[manager_name] = {};

        // RenameManager uses old-style Prototype Klass code hence we don't subclass
        // it but rather wrap it.

        var InternalRenameManager = Class.create(RenameManager, {

                // Do a rename. This overwrites the origianl ajax call of RenameManager.
                //
                _do_rename : function (new_name) {

                    var cmp = this._old_name.localeCompare(new_name);

                    if (cmp && (new_name || (!new_name && this._allow_blanks))) {

                        var ret  = callback(new_name),
                            data = {};

                        if (ret === false) {

                            // Failure don't do the update

                            data.message = "Update failed";

                        }
                        else {
                            // Success do the update

                            $(manager_name + "_label").update(new_name.escapeHTML());
                        }

                        this._do_rename_update(data);
                        this._swap_back();
                        this._clear();
                    }
                    else {

                        if (this._name_element && this._name_element.innerHTML === "") {

                            // Don't switch back if the input field is still empty ...

                            return;
                        }

                        this._swap_back();
                        this._clear();
                    }
                },

                edit_type_catch : function ($super, element, event) {

                    if (value_update !== undefined) {
                        if (event && event.keyCode === 27) {
                            value_update("");
                        }
                        else {
                            value_update(element.value);
                        }
                    }

                    // Make sure we call _do_rename if no name exists

                    var ret;
                    if (event && (event.keyCode === 27 || event.keyCode === 13) &&
                        this._name_element && this._name_element.innerHTML === "") {

                        if (this._editor_element && event.keyCode === 27) {
                            this._editor_element.value = "";
                        }

                        ret = $super(element);
                        this._do_rename(ret);

                    }
                    else {
                        ret = $super(element, event);
                    }

                    return ret;
                },

                focus_lost : function ($super) {
                    if (this.can_blur) {
                        if (focus_lost !== undefined) {
                            focus_lost();
                        }

                        // Make sure we call _do_rename if no name exists

                        if (this._name_element && this._name_element.innerHTML === "") {
                            if (this._editor_element) {

                                if (this._editor_element.value === "") {
                                    return;
                                }

                                this._do_rename(this.edit_type_catch(this._editor_element));
                                return;
                            }
                        }
                        $super();
                    }
                },

                can_blur: true // Clicking on link near the input will rely on
                               // this flag to check whether we need to collapse input or not
            }),
            rename_manager = new InternalRenameManager("", {});

        // Create reference to manager

        tw.viz._rename[manager_name]["obj"] = rename_manager;

        // Create components

        component.insert("div")
            .classed("app-name-display", true)
            .attr("id", manager_name + "_display")
            .insert("span")
            .attr("id", manager_name + "_label")
            .text(label);

        component.insert("span")
            .attr("id", manager_name + "_edit")
            .style("display", "none")
            .insert("input")
            .attr("placeholder", "Please enter a name")
            .attr("aria-label", "Application name field")
            .attr("id", manager_name + "_editor")
            .attr("onchange", "tw.viz._rename." + manager_name + ".obj.edit_type_catch(this, event)")
            .attr("onkeyup", "tw.viz._rename." + manager_name + ".obj.edit_type_catch(this, event)")
            .attr("onfocus", "tw.viz.visualization.keyboard_input = true;")
            .attr("onblur", "tw.viz._rename." + manager_name + ".obj.focus_lost();" +
                            "tw.viz.visualization.keyboard_input = false;");

        component.insert("a")
            .attr("href", "javascript:tw.viz._rename." + manager_name + ".edit()")
            .attr("id", manager_name + "_icon")
            .insert("img")
            .attr("src", edit_icon)
            .attr("alt", manager_name);

        component.insert("span")
            .classed("app-name-message", true)
            .attr("id", manager_name + "_message");

        var edit_func = function () {
            var label_element = $(manager_name + "_label");
            if (!label_element.data) {
                label_element.data = label;
            }
            rename_manager.edit_name(
                $(manager_name + "_display"), label_element, $(manager_name + "_edit"),
                $(manager_name + "_editor"), $(manager_name + "_message"), $(manager_name + "_icon"), {}
            );
        };

        tw.viz._rename[manager_name]["edit"] = edit_func;

        // Deal with the initial case when we don't have any value
        // the user should see an input field prompting him/her
        // to enter a name

        if (label === "") {
            edit_func();
        }
    }
});

// Internal reference to rename manager calls
// (should only be used by tw.viz.AppModellingRenameManager)

tw.viz._rename = {};

/* global Prototype, d3, cola, dagre, autocloser, Draggable, mergeObjects,
   Control, bindContext, TWClass, $R, saveSvg, saveSvgAsPng, getPageFormats,
   debounce, countBy, whenWasThat, copyObject, isElementInViewport,
   showConfirmDialog, createMessageBoard, messageBoardRaise, messageBoardClose */

/* jshint sub: true, nonew: false, scripturl: true, maxerr: 200 */

/*
 * WARNING: Uncaught exceptions are known to cause PhantomJS to eat up all RAM.
 *
 * Please take extra care when you make assumptions about DOM. Even if your code
 * works on regular visualization pages, certain DOM elements may not be there
 * on the page we use to generate reports.
 *
 * Ideally check your code on /ui/StaticVisualization?context_id=0&id=NODE_ID
 * to make sure there're no uncaught exceptions.
 */

/*
 * NOTE: Refer to the SaaM developer checklist when working with this code
 * https://confluence.bmc.com/display/Discovery/Start+Anywhere+Application+Modelling+developer+checklist
 */


if (tw === undefined) {
    var tw = {};
}
if (tw.viz === undefined) {
    tw.viz = {};
}

// Factory functions

tw.viz.nodeViewInlineViz = function(viz_name, node_id, enabled, show_big, show_labels,
                                    layout, impact_direction, small_x, small_y, is_search,
                                    enable_editing, app_modelling_enabled, user_options) {

    "use strict";

    if (tw.viz.isInvalidBrowser()) {
        return;
    }

    var options = mergeObjects(user_options, {
        enable_editing        : enable_editing,
        layout                : layout,
        impact_direction      : impact_direction,
        show_big              : show_big,
        small_x               : small_x,
        small_y               : small_y,
        show_labels           : true,
        app_modelling_enabled : app_modelling_enabled
    });

    tw.viz.visualization = new tw.viz.NodeViewVisualization(viz_name, node_id,
                                                            options, enabled);
};

tw.viz.searchInlineViz = function(viz_name, node_id, enabled, show_big, show_labels,
                                  layout, impact_direction, small_x, small_y, is_search,
                                  enable_editing, app_modelling_enabled, user_options) {
    "use strict";

    if (tw.viz.isInvalidBrowser()) {
        return;
    }

    var options = mergeObjects(user_options, {
        enable_editing        : enable_editing,
        layout                : layout,
        impact_direction      : impact_direction,
        show_big              : show_big,
        small_x               : small_x,
        small_y               : small_y,
        show_labels           : true,
        app_modelling_enabled : app_modelling_enabled,
        can_close             : false
    });

    tw.viz.visualization = new tw.viz.SearchVisualization(viz_name, node_id,
                                                          options, enabled);
};

tw.viz.cmdbPreviewViz = function(viz_name, node_id, datamodel, enabled, show_big, show_labels,
                                 layout, impact_direction, small_x, small_y, is_search, user_options) {
    "use strict";

    if (tw.viz.isInvalidBrowser()) {
        return;
    }

    var options = mergeObjects(user_options, {
        layout           : layout,
        impact_direction : impact_direction,
        show_big         : show_big,
        small_x          : small_x,
        small_y          : small_y,
        show_labels      : true,

        nodes_clickable  : false, // Cannot click nodes

        can_change_focus : false // Cannot change focus
    });

    tw.viz.visualization = new tw.viz.CMDBPreviewVisualization(viz_name, node_id,
                                                               datamodel,
                                                               options, enabled);
};

tw.viz.appModellingViz = function(app_name, app_properties, clone_id, source_id, app_id, viewing_bai, published, view_mode, node_id, enabled,
                                  show_big, show_labels, layout, impact_direction, small_x, small_y,
                                  user_options) {
    "use strict";

    if (tw.viz.isInvalidBrowser()) {
        return;
    }

    var options = mergeObjects(user_options, {
        view_mode        : view_mode,
        layout           : layout,
        impact_direction : impact_direction,
        show_big         : show_big,
        small_x          : small_x,
        small_y          : small_y,
        show_labels      : true
    });

    tw.viz.visualization = new tw.viz.AppModellingVisualization(
        app_name, app_properties, node_id, clone_id, source_id, app_id, viewing_bai, published, options, enabled, published
    );
};


tw.viz.staticViz = function(node_id, context_id) {
    "use strict";

    tw.viz.visualization = new tw.viz.StaticVisualization(node_id, context_id);
};

// Debug factory function which accepts JSON data

tw.viz.showViz = function(data) {
    "use strict";

    var top_div = d3.select("div[class=InlineVisualization]");
    if (top_div[0][0] === null) {
        console.log("No div[class=InlineVisualization] found");
        return;
    }
    top_div.html("");

    tw.viz.DEBUGVisualization = tw.viz.Visualization.create(
        tw.viz.SelectionMixIn, {

        showContextMenu : function () {
            // Do not show a custom context menu.
        },

        // Request the initial data from the backend.
        //
        _requestInitialData : function () {
            this._handleData(JSON.parse(data));
        },

        _getVizStateForNode : function (n, state) {
            var super_result = this._super(n, state);
            return super_result && this._getSelectionVizStateForNode(n, state);
        }
    });

    tw.viz.visualization = new tw.viz.DEBUGVisualization("Debug Visualization", "", {
        show_big       : true,
        show_labels    : true
    }, true);
};

// Helper functions

tw.viz.isInvalidBrowser = function () {
    "use strict";

    return Prototype.Browser.IE6 || Prototype.Browser.IE7 ||
           Prototype.Browser.IE8 || Prototype.Browser.IE9;
};

// Tell if the browser is Internet Explorer (any version).
//
tw.viz.isBrowserIE = function () {
    "use strict";
    return Prototype.Browser.IE;
};

tw.viz.isBrowserFirefox = function () {
    "use strict";
    return Prototype.Browser.Gecko;
};


// Images used for the visualization

/*tw.viz.DEFAULT_IMAGES = {
	force_directed					 : "styles/default/images/sidebar/svg/force-direct.svg",
	sidebar_layout					 : "styles/default/images/sidebar/svg/layout.svg",
	sidebar_arrow_logo               : "styles/default/images/sidebar/svg/utility-icon.svg",
	settings_logo               : "styles/default/images/sidebar/svg/settings.svg",
    viz_logo                    : "styles/default/images/general/png/normal/viz_logo_24.png",
    search_normal               : "styles/default/images/sidebar/png/normal/search_24.png",
    layout_normal               : "styles/default/images/general/png/normal/viz_logo_24.png",
    add_normal                  : "styles/default/images/general/png/disabled/add_green_24_dis.png",
    hide_normal                 : "styles/default/images/general/png/disabled/delete_24_dis.png",
    notes_normal                : "styles/default/images/appliance/png/disabled/mail_24_dis.png",
    help_normal                 : "styles/default/images/sidebar/png/normal/viz_help_24.png",
    help_hot                    : "styles/default/images/sidebar/png/hot/viz_help_24_hot.png",
    manual_groups_normal        : "styles/default/images/sidebar/png/normal/viz_group_24.png",
    manual_groups_hot           : "styles/default/images/sidebar/png/hot/viz_group_24_hot.png",
    manual_groups_none          : "styles/default/images/general/png/normal/cancel_24.png",
    manual_groups_indicator     : "styles/default/images/general/png/normal/info_24_grey.png",
    manual_groups_label         : "styles/default/images/general/png/normal/labels_24.png",
    surrounds_none              : "styles/default/images/general/png/normal/cancel_24.png",
    surrounds_location          : "styles/default/images/general/png/normal/location_24.png",
    surrounds_node              : "styles/default/images/general/png/normal/node_24.png",
    surrounds_model_updates     : "styles/default/images/general/png/normal/model_updates_24.png",
    x_normal                    : "styles/default/images/general/png/normal/close_16.png",
    x_hot                       : "styles/default/images/general/png/hot/close_16_hot.png",
    less_normal                 : "styles/default/images/general/png/normal/neutral_less_16.png",
    less_hot                    : "styles/default/images/general/png/hot/neutral_less_16_hot.png",
    more_normal                 : "styles/default/images/general/png/normal/neutral_more_16.png",
    more_hot                    : "styles/default/images/general/png/hot/neutral_more_16_hot.png",
    select_normal               : "styles/default/images/sidebar/svg/drag_mode.svg",
    drag_normal                 : "styles/default/images/sidebar/svg/group-2.svg",
    error_icon                  : "styles/default/images/flashboard/png/normal/failure_16.png",
    info_icon                   : "styles/default/images/general/png/normal/info_16.png",
    full_screen_normal          : "styles/default/images/general/png/normal/fullscreen_16.png",
    full_screen_hot             : "styles/default/images/general/png/hot/fullscreen_16.png",
    viz_force                   : "styles/default/images/general/png/normal/viz_forceDirected_32.png",
    viz_impact                  : "styles/default/images/general/png/normal/viz_impact_32.png",
    viz_rootattop               : "styles/default/images/general/png/normal/viz_root_at_top_32.png",
    viz_direct_rels             : "styles/default/images/general/png/normal/viz_routing_direct_32.png",
    viz_ortho_rels              : "styles/default/images/general/png/normal/viz_routing_ortho_32.png",
    viz_avoiding_rels           : "styles/default/images/general/png/normal/viz_routing_avoid_32.png",
    rotate_axes                 : "styles/default/images/general/png/normal/rotateAxes_24.png",
    arrow_up                    : "styles/default/images/sidebar/svg/arrowup.svg",
    arrow_down                  : "styles/default/images/sidebar/svg/arrowdown.svg",
    arrow_left                  : "styles/default/images/sidebar/svg/arrowleft.svg",
    arrow_right                 : "styles/default/images/sidebar/svg/arrowright.svg",
    layout_labels               : "styles/default/images/general/png/normal/labels_24.png",
    showhide                    : "styles/default/images/general/png/normal/show_hide_32.png",
    exportsidebar               : "styles/default/images/sidebar/svg/export.svg",
    svgexport                   : "styles/default/images/general/png/normal/Export_SVG_32.png",
    pngexport                   : "styles/default/images/general/png/normal/Export_PNG_32.png",
    printer                     : "styles/default/images/kind/png/normal/Printer_32.png",
    modelexport                 : "styles/default/images/general/png/normal/Export_Model_Def_32.png",
    appmodedit                  : "styles/default/images/appliance/png/normal/info_32.png",
    appmodmodel                 : "styles/default/images/kind/png/normal/ModelDefinition_32.png",
    appmodmodel_dis             : "styles/default/images/kind/png/disabled/ModelDefinition_32_dis.png",
    appmodeprop                 : "styles/default/images/general/png/normal/properties_32.png",
    saveicon_hover              : "styles/default/images/general/png/hot/save_32_hot.png",
    saveicon                    : "styles/default/images/general/png/normal/save_32.png",
    saveicon_dis                : "styles/default/images/general/png/disabled/save_32_dis.png",
    publishicon                 : "styles/default/images/general/png/normal/publish_32.png",
    deleteicon                  : "styles/default/images/general/png/normal/trash_32.png",
    removednodes                : "styles/default/images/sidebar/svg/hide.svg",
    removednodes_hl             : "styles/default/images/general/png/normal/removed_nodes_32_teal.png",
    focus_menu                  : "styles/default/images/sidebar/png/normal/viz_focus_24.png",
    focus_menu_dis              : "styles/default/images/sidebar/png/disabled/viz_focus_24_dis.png",
    focus_sw                    : "styles/default/images/kind/png/normal/SoftwareInstance_32.png",
    focus_infra                 : "styles/default/images/kind/png/normal/NetworkDevice_32.png",
    editicon_hover              : "styles/default/images/general/png/hot/edit_24_hot.png",
    editicon                    : "styles/default/images/general/png/normal/edit_24.png",
    cancelicon_hover            : "styles/default/images/general/png/hot/cancel_32_hot.png",
    cancelicon                  : "styles/default/images/general/png/normal/cancel_32.png",
    cancelicon_dis              : "styles/default/images/general/png/disabled/cancel_32_dis.png",
    discardicon                 : "styles/default/images/general/png/normal/discard_32.png",
    favorite                    : "styles/default/images/general/png/normal/favourite_16.png",
    favorite_dis                : "styles/default/images/general/png/disabled/favourite_16_dis.png",
    warning_normal              : "styles/default/images/general/png/normal/message_board_warning_24.png",
    loading_icon                : "styles/default/images/loader_32.gif",
    icon_undo_normal            : "styles/default/images/sidebar/png/normal/icon_undo_24.png",
    icon_undo_hover             : "styles/default/images/sidebar/png/hot/icon_undo_24_hot.png",
    icon_undo_dis               : "styles/default/images/sidebar/png/disabled/icon_undo_24_dis.png",
    icon_redo_normal            : "styles/default/images/sidebar/png/normal/icon_redo_24.png",
    icon_redo_hover             : "styles/default/images/sidebar/png/hot/icon_redo_24_hot.png",
    icon_redo_dis               : "styles/default/images/sidebar/png/disabled/icon_redo_24_dis.png",
    extend_new_normal           : "styles/default/images/general/png/normal/show_more_nodes_16_normal.png",
    extend_removed_normal       : "styles/default/images/general/png/normal/removed_nodes_16_normal.png",
    extend_suppressed_normal    : "styles/default/images/general/png/normal/excluded_by_rules_16.png",
    extend_new_hot              : "styles/default/images/general/png/hot/show_more_nodes_16_hot.png",
    extend_removed_hot          : "styles/default/images/general/png/hot/removed_nodes_16_hot.png",
    extend_suppressed_hot       : "styles/default/images/general/png/hot/excluded_by_rules_16_hot.png"
};*/

// Contexts
// This list needs to be in sync with the items in python/api/visualization/__init__.py

/* tw.viz.CONTEXT_LABELS = [
    [ 0, "Software - Connected", tw.viz.DEFAULT_IMAGES.focus_sw ],
    [ 2, "Software", tw.viz.DEFAULT_IMAGES.focus_sw ],
    [ 1, "Infrastructure", tw.viz.DEFAULT_IMAGES.focus_infra ]
];*/

tw.viz.CONTEXT_LABELS = [
    [ 0, "Software - Connected",''],
    [ 2, "Software", '' ],
    [ 1, "Infrastructure", '' ]
];

// Warning icon - transparent exclamation mark in a triangle
// Needs a background polygon with stroke, otherwise the exclamation mark
// is transparent.
tw.viz.WARNING_ICON = {
    "path": "M13.6,1.2l10.1,19.6c0.4,0.8,0.5,1.6,0.1,2.2c-0.3,0.6-1,1-1.9,1H2.1c-0.9,0-1.5-0.3-1.9-1s-0.3-1.3,0-2.1L10.4,1.2  C10.8,0.4,11.3,0,12,0C12.6,0,13.1,0.4,13.6,1.2z M13.4,15.3V8.6h-2.9v6.7C10.6,15.3,13.4,15.3,13.4,15.3z M13.4,20.1v-2.9h-2.9v2.9  H13.4z",
    "transform": "scale(0.4) translate (-12,-12)",
    "bg_polygon_points": "0,23 12,0 24,23"
};

/*tw.viz.DEFAULT_RELATIONSHIPS = [
    [ "DefinitionContainment", "Definition Containment" ],
    [ "HostedSoftware",        "Hosted Software" ],
    [ "CloudService",          "Cloud Service" ],
    [ "HostContainment",       "Host Containment" ],
    [ "Communication",         "Communication" ],
    [ "ObservedCommunication", "Observed Communication"],
    [ "Dependency",            "Dependency" ],
    [ "SoftwareContainment",   "Software Containment" ],
    [ "Detail",                "Database Containment"],
    [ "Containment",           "Containment" ],
    [ "Collection",            "Collection" ],
    [ "SoftwareService",       "Software Service" ],
    [ "NetworkService",        "Network Service" ],
    [ "Management",            "Management" ],
    [ "MultiFacet",            "Multi-Facet" ],
    [ "StorageUse",            "Storage Use" ],
    [ "Storage",               "Storage" ],
    [ "FileSystemMount",       "File System Mount" ],
    [ "ExportedFileSystem",    "Exported File System" ],
    [ "DeviceInterface",       "Edge Switch" ],
    [ "DeviceSubnet",          "Subnet" ],
    [ "CouplingFacility",      "Coupling Facility" ]
];*/

// Default number of iterations for various operations when (re)starting
// the layout process.
//
// Each value should be an array of arguments to be passed into force.start()
// method. This happens in startLayout() method.
//
// The arguments are as follows (we only use the first three now):
// * {number} (default 0) unconstrained initial layout iterations
// * {number} (default 0) initial layout iterations with user-specified
//                        constraints
// * {number} (default 0) initial layout iterations with all constraints
//                        including non-overlap
// * {number} (default 0) iterations of "grid snap", which pulls nodes towards
//                        grid cell centers - grid of size node[0].width - only
//                        really makes sense if all nodes have the same
//                        width and height
//                        [WE DON'T USE GRID SNAPS AS OF 31.03.2016]
// * {boolean} (default true) keep iterating asynchronously via the tick method
//                            [WE WANT THIS TO ALWAYS BE TRUE]
//
// See:
// http://marvl.infotech.monash.edu/webcola/doc/classes/cola.layout.html#start
// and Cola's source:
// https://github.com/tgdwyer/WebCola/blob/master/WebCola/src/layout.ts#L477

/*tw.viz.DEFAULT_LAYOUT_ITERATIONS = {
    initial             : [0,  0,  0 ],   // used in _afterSetState method
    default             : [5,  10, 15],   // fallback value

    set_state_dynamic   : [20, 30, 40],   //
    set_state_static    : [20, 30, 60],   // used in _afterSetState method
    set_state_subsequent: [0,  10, 20],   //

    show_labels         : [0,  0,  0 ],   // used in showLabels
    hide_labels         : [0,  0,  0 ],   // used in hideLabels

    transpose           : [0,  0,  1 ],   // used in transpose
    change_layout       : [20, 30, 40],   // used in changeLayout

    hide_node_kind      : [0,  0,  10],   // both...
    show_node_kind      : [5,  10, 15],   // ...are used in showHide

    extend_model        : [5,  10, 15],   // used in ExtendModelMixIn::extendModel

    // these two are used in removeNode, restoreNode and _setVisibilityFlag:
    hide_node           : [0,  0,  10],   // remove or hide a node
    restore_node        : [5,  10, 15],   // restore or unhide a node

    expand_collection   : [5,  10, 15],   // used in CollectionsMixIn::expandCollection
    collapse_collection : [5,  10, 15]    // used in CollectionsMixIn::collapseCollection
};*/

// Default options which can be overridden by the user

/*tw.viz.DEFAULT_OPTIONS = {

    show_big          : false,     // Flag to indicate if the visualization
                                   // should be shown maximized

    small_x           : -1,        // X Position of draggable

    small_y           : -1,        // Y Position of draggable

    show_labels       : false,     // Flag if labels should be shown on nodes

    highlight_root    : true,      // If true, "root" nodes are highlighted

    highlight_shared  : true,      // If true, shared nodes are highlighted

    dynamic           : true,      // If true, register dynamic behaviour

    enable_editing    : false,     // If true, enable application modelling editor
                                   // functions for visualizations that support it

    app_modelling_enabled : true,  // Controls if the app modelling actions
                                   // are available (see AppModellingMixin)

    app_needs_attention    : false, // Flag to indicate if the model needs attention
    highlight_model        : false, // Flag to highlight model state indicator
                                    // on visualization

    si_create_permission   : false, // Permission to create SIs
    app_edit_permission    : false, // Permission to edit an application model
    app_publish_permission : false, // Permission to publish an application model,
                                    // manipulate rules and shared flag overrides
                                    // (follows backend logic)

    view_mode         : true,      // Flag to enable a view only mode which prevents
                                   // the user to change the model permanently

    can_close         : true,      // The visualization windows can be closed

    can_change_focus  : true,      // The visualization can change focus
    can_remove_nodes  : true,      // Nodes can be removed from the display

    extra_focus       : [],        // List of extra focuses

    layout            : 0,
    impact_direction  : "BT",      // Impact direction

    surround_type     : "location", // Type of node surround
    
    // URL used to get the initial data via AJAX requests
    // this should differ for SoftwareContext and application model editor
    ajax_url                        : "/ui/AjaxInlineVisualization",

    // URL used to get group / collection node expand data
    // this shouldn't differ unless you're doing custom expanding
    expand_collection_api_url       : "/ui/AjaxInlineVisualization",

    // URL that holds the ModelDefinitions API (for app modelling)
    model_definitions_api_url       : "/ui/i/ModelDefinitions",

    // URL to get all existing ModelDefinition names along with node id
    model_definitions_names_url     : "/ui/i/ModelDefinitions/Names",

    // URL to get the ModelDefinitions that have been favorited
    model_definitions_favorites_url : "/ui/i/ModelDefinitions/Favorites",

    // Number of nodes in a model before system warns the user about potential
    // rendering problem in browser. Value 0 means no warning should be made.
    max_nodes_per_model             : 300,

    // URL for rule operations
    rule_operations_api_url         : "/ui/i/ModelRules",

    // URL for rule evaluation
    rule_evaluation_api_url         : "/ui/i/ModelRulesEval",

    // URL for creating pending rules data
    pending_rule_api_url            : "/ui/i/ModelRulesData",

    // URL for node view in datastore
    node_view_url                   : "/ui/InfrastructureView?nodeID=",

    // URL & nonce for node operations
    node_operations_api_url         : "/ui/i/NodeOperations",
    node_operations_nonce_token     : undefined,

    images            : tw.viz.DEFAULT_IMAGES,

    shapes            :  undefined, // tw.viz.DEFAULT_SHAPES,

    icons             : tw.cmdb_graph_viz.cmdb_icons, // Use this option if icons
                                   // instead of shapes should be displayed

    relationships     : tw.viz.DEFAULT_RELATIONSHIPS, //used as a data for markers

    relationships_map : {}, //used to faster translate for link hover popup

    nonce_token       : "", // Used for verifying valid POST request

    button_label      : undefined, // Optional button label text
                                   // (instead of viz name)

    context_id        : undefined, // Optional context ID. If not set
                                   // users preference is used (but nothing
                                   // in the Focus sidebar will be selected)

    nodes_clickable   : true,      // Whether to make nodes clickable

    load_rules        : true,      // Flag to indicate if the global rules should be
                                   // loaded during the init stage.

    // How many cola layout iterations to do for certain actions.
    layout_iterations : tw.viz.DEFAULT_LAYOUT_ITERATIONS,

    // Selector for the top div (must be compatible with d3.select)
    top_div_selector  : "div[class=InlineVisualization]",

    // Sidebar menu highlight timeout (in milliseconds)
    side_bar_highlight_timeout : 10000
};*/




// Main class for visualizations.
//
tw.viz.Visualization = TWClass.create({

    // Constants:

    // Proportion of browser window size to dedicate to the visualization
    SMALL_W_SCALE : 0.25,
    SMALL_H_SCALE : 0.25,
    BIG_W_SCALE   : 0.95,
    BIG_H_SCALE   : 0.85,

    // Base lengths
    NO_LABELS_LENGTH  : 40,
    LABELS_LENGTH     : 70,
    NODE_SIZE         : 20,
    HIERARCHICAL_SIZE : 80,

    // Assumed size of a node when labels are shown
    // Used to layout unknown sized nodes
    LABELS_NODE_SIZE  : 100,

    // Length to word wrap
    LABEL_TEXT_LENGTH : 100,

    // Surround sizes
    SMALL_SURROUND_SIZE : 40,
    BIG_SURROUND_SIZE   : 80,
    
    // Transition times
    LAYOUT_TRANSITION      : 750,
    LINE_TRANSITION        : 375,
    FADE_TRANSITION        : 750,
    ZOOM_TRANSITION        : 250,

    // Classes for the div containing the visualization
    SMALL_DIV_CLASS : "InlineVisualizationSmall",
    BIG_DIV_CLASS   : "InlineVisualizationBig",

    // Exports
    PNG_EXPORT_SCALE : 2.0,      // twice the resolution for png exports

    // Events
    EVENT_HANDLER_SIGNIFICANT_CHANGES : "event_handler_significant_changes",

    // Groups
    EXPLODE_GROUPS_ALL : "all",

    // Used as a prefix for virtual links associated with collections
    LINK_COPY_PREFIX : "004200",


    // Show/hide menu constants
    SHOW_HIDE_SECTION : "Nodes",
    SHOW_HIDE_UNKNOWN : "Unknown",


    // Attributes

    // Current state
    viz_name         : "",        // Name of the visualization
    data_id          : undefined, // ID for initial data (send to the backend)
    options          : undefined, // Options for the visualization
    enabled          : true,      // Flag to indicate if the visualization is enabled
    showing_labels   : false,     // Flag if labels are shown
    showing_key      : false,     // Flag if the help window is shown
    has_depth        : false,     // Flag to indicate if the current graph has depth
    w_scale          : 0,         // Width scaling
    width            : 0,         // Actual width of window in pixels
    h_scale          : 0,         // Height scaling
    height           : 0,         // Actual height of window in pixels
    zoom_countdown   : 0,         // Counters for zooming
    zoom_countdown_2 : 0,
    zoom_fit         : 0,         // Zoom value when all nodes fit bounds (initial zoom)
    mouse_mode       : 0,         // Current mouse mode
    mouse_over       : false,     // Flag to indicate if the mouse is over the visualization
    full_screen      : false,     // Flag to indicate that visualization is full screen
    keyboard_input   : false,     // Flag to indicate if keyboard input is active
    pending_changes  : false,     // Flag if significant model changes are pending
    node_picker_mode : false,     // Flag to indicate if the visualization is in the node picker mode

    // Show Hide State.
    // Object representing a set of parameters that describe current state of
    // show/hide operation.
    //
    // Show/Hide function works in next algorithm:
    //
    // In case of multiple show/hide function execution(ex: user is rapidly clicking). The
    // debounce_timeout for real DOM show/hide nodes is started, and show_hide_state is created.
    //
    // In case show/hide was executed again, until timeout is finished, show_hide_state is updated,
    // and timeout is restarted.
    //
    // In case no new show/hide execution were called during a timeout, read DOM show/hide elements
    // is applied

    // This allows us to combine multiple calls into one real DOM show/hide operation
    show_hide_state : {
        hidden_kinds        : undefined, // List of hidden node kinds at the beginning of multiple
        // show/hide function calls. Used to be compared with hidden_kinds after a set of
        // show/hide calls to detect and react on changes
        affected_collections: undefined  // List of nodes(collections) that were affected by the
        // set of show/hide function call. Used to redraw only node collections that were
        // affected byt last set of show/hide function calls
    },

    // Nodes and relationships
    nodes_map     : undefined,  // Node id -> node state
    all_nodes     : undefined,  // Array of all nodes that have been given to cola
    links_map     : undefined,  // Link id -> link state
    all_links     : undefined,  // Array of all known relationships
    vis_nodes     : undefined,  // Array of visible nodes
    vis_links     : undefined,  // Array of visible relationships
    root_kind     : undefined,  // Root node kind (one arbitrary one if starting
                                // from multiple nodes)
    removed_nodes : undefined,  // Node id -> node state (for initially removed nodes)
    filterRelApplied :false,

    max_manual_groups_display: 5, // Counter on how many manual groups indicators to be displayed before "..."

    // Hardcoded list of colors for manual groups indicators
    manual_group_color_list   : ["#f86e00", "#7cb238", "#df2d00", "#0072bc",
                                 "#f1b521", "#f054b0", "#3cb6ce", "#8560a8",
                                 "#00a79d", "#d1602b"],
    manual_group_color_map    : {}, // Used to store colors for manual groups indicators

    // Colours for surrounds
    surround_color_list       : ["#f86e00", "#7cb238", "#df2d00", "#0072bc",
                                 "#f1b521", "#f054b0", "#3cb6ce", "#8560a8",
                                 "#00a79d", "#d1602b",
                                 "#a54900", "#527625", "#941e00", "#004c7d",
                                 "#a07816", "#a03875", "#287989", "#584070",
                                 "#006f68", "#8b401c",
                                 "#7c3700", "#3e591c", "#6f1600", "#00395e",
                                 "#785a10", "#782a58", "#1e5b67", "#423054",
                                 "#00534e", "#683015", "#2b60d1"
                                ],
    
    // Statistics
    max_edge_neighbours : 0,

    collection_members  : undefined,  // Node id -> Collection id

    // Context menu entries (for docs, see "addContextMenuItems" method)
    CONTEXT_MENU_ITEMS : undefined,

    // Hidden node kinds
    hidden_kinds : undefined,

    // Control objects
    force       : undefined, // Cola D3 adapter object
    zoom        : undefined, // D3 object to manipulate the zoom level
    zoom_slider : undefined, // Zoom slider Control object

    // DOM objects

    top_div                   : undefined, // Top-level containing div

    in_div                    : undefined, // Inner div containing the visualization
    title_span                : undefined, // Title span element
    svg                       : undefined, // Main SVG which shows the visualization
    back_rect                 : undefined, // Background rectangle for visualization
    message                   : undefined, // Text message shown to the user
                                           // (only defined if shown)
    expand_btn                : undefined, // Button to expand/shrink the window
	settings_btn			  : undefined,  // Button to open setting page
    ctrl_div                  : undefined, // Div which holds visualization controls
                                           // (dropdown menus)
    draggable                 : undefined, // Draggable object - only set
                                           // if show_big is false
    zoom_slider_div           : undefined, // Div which holds zoom slider

    key_div                   : undefined, // Div for help window
    key_div_style             : undefined, // Style for help window
    key_draggable             : undefined, // Draggable object for help window

    context_menu_div          : undefined, // Div for context menu
    context_menu_items        : undefined, // Items for context menu

    switch_wide_tall_disabled : undefined, // Disabled button for wide/tall
                                           // toggle

    start_app_model_enabled   : undefined, // Enabled button to start app model
    start_app_model_disabled  : undefined, // Disabled button to start app model

    container                 : undefined, // Grouping (g) element for all nodes
    container_node            : undefined, // Node of grouping element
    exit_full_screen          : undefined, // Exit full screen button

    cursor_tooltip            : undefined, // Span for cursor tooltip

    // Groups and selections of them
    links_group                     : undefined, // links
    link_sel                        : undefined,
    nodes_group                     : undefined, // nodes
    node_sel                        : undefined,
    hulls_group                     : undefined, // hulls
    hull_sel                        : undefined,
    surrounds_group                 : undefined, // node surrounds
    surround_sel                    : undefined,
    clips_group                     : undefined, // clip paths for surrounds
    clip_sel                        : undefined,
    text_group                      : undefined, // node labels
    text_sel                        : undefined,
    manual_group_indicators_group   : undefined, // manual group indicators
    manual_group_indicators_sel     : undefined,

    // Layout state

    clip_paths                      : {},        // node id -> path to clip
                                                 //   its surround
    all_clip_paths                  : {},        // clip paths including ones
                                                 //   for nodes that have been
                                                 //   removed from view
    
    // Line generators
    hull_line   : d3.svg.line().interpolate("basis-closed"),
    
    linear_line : d3.svg.line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; })
        .interpolate("linear"),

    basis_line : d3.svg.line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; })
        .interpolate("basis"),

    voronoi    : d3.geom.voronoi()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y - d.y_offset; }),

    voronoi_line : d3.svg.line()
        .interpolate("linear-closed"),


    // Constructor
    //
    // viz_name - Name of the visualization.
    // options  - Configuration values for the visualization. Unset values are
    //            set to the corresponding values in DEFAULT_OPTIONS).
    // enabled  - Flag to indicate if the visualization is enabled.
    //
    init : function (viz_name, data_id, options, enabled) {
        "use strict";

        this.CONTEXT_MENU_ITEMS  = {};
        this.SIDE_BAR_MENU_ITEMS = [ ];

        this.hidden_kinds       = {};
        this.collection_members = {};

        this.options = mergeObjects(tw.viz.DEFAULT_OPTIONS,
                                    options ? options : {});

        this.options.highlight_model = sessionStorage.highlight_model === this.app_name;

        this.options.relationships.each(function(relationship) {
            this.options.relationships_map[relationship[0]] = relationship[1];
        }, this);

        this.viz_name = viz_name ? viz_name : "";
        this.data_id  = data_id;
        this.enabled  = enabled !== false;
        this.top_div  = d3.select(this.options.top_div_selector);

        this.linkPath = this.linkArc.bind(this);

        this.routing = 0;
        this.prev_layout = this.options.layout;

        this.addSideBarMenuItems();
        this.addContextMenuItems();

        this.addPrintDialogEventsHandler();

        if (this.enabled) {
            this.construct();
            this.start();
        }

        this.classType = 'All';

        // Don't subscribe preview visualization on any event. Subscribing it
        // on any event will change `this` context for event handlers
        if (!this.is_preview) {
            if (this.subscribeEventHandler !== undefined) {
                this.subscribeEventHandler(
                    "update_sidebar_on_node_visibility_change",
                    [
                        this.EVENT_SET_INITIAL_DATA,
                        this.EVENT_NODE_VISIBILITY_CHANGE,
                        this.EVENT_REMOVE_NODE,
                        this.EVENT_RESTORE_NODE,
                        this.EVENT_SHOW_NODE_KIND,
                        this.EVENT_HIDE_NODE_KIND
                    ],
                    bindContext(this, this.updateSideBarMenu)
                );
            }

            this.subscribeOnSignificantChanges();
        }

        this.defineShowHideDelayed();
    },

    // Construct all DOM elements for visualization.
    //
    construct : function () {
        "use strict";

        this.div_class = this.options.show_big ? this.BIG_DIV_CLASS
                                               : this.SMALL_DIV_CLASS;

        //
        // Inner div containing the visualization

        this.in_div = this.top_div.append("div")
            .attr("class", this.div_class)
            .attr("id", this.inner_id || "InlineVisualizationInner");

        this.in_div
            .on("mouseover.active", function() {
                this.mouse_over = true;
            }.bind(this))
            .on("mousedown", function() {
                this.in_div.classed("InlineVisualizationActive", true);
            }.bind(this))
            .on("mouseleave.active", function() {
                this.mouse_over = false;
                if(!this.full_screen) {
                    this.in_div.classed("InlineVisualizationActive", false);
                }
            }.bind(this));

        this.viz_container = this.in_div
            .append("div")
            .attr("class", "softwareContextVizContainer");

        this.cursor_tooltip = this.viz_container.append("span")
            .classed("cursor-tooltip", true);

        //
        // Header with buttons

        var header = this.in_div.append("div")
            .attr("class", "InlineVisualizationHeader")
            .attr("id", this.header_id || "InlineVisualizationHeader");

        header.append("img")
            .attr("src", this.options.images.viz_logo)
            .attr("style","float:left;")
            .attr("alt", "");

        this.title_span = header.append("span")
				.attr("class", "InlineVisualizationTitle")
                .attr("style","float:left;margin-top: 10px;")
				.text(" " + this.viz_name);

        var actionDropDown = document.createElement('span');
        actionDropDown.setAttribute('style','float:right;');
        actionDropDown.setAttribute('id', 'actionDropDownSpan');
        var actionButton = document.createElement('buttton');
        actionButton.setAttribute('class','actionDropDownCls bmc-btn-dropdown-inner')
        actionButton.innerHTML = labels.Actions;
        actionButton.addEventListener(
            'click',
            function() { toggleDropdown(); },
            false
         );
        var seperetorDiv = document.createElement('div');
        seperetorDiv.setAttribute('id', 'seperetorDiv');
        actionDropDown.appendChild(seperetorDiv);
        actionDropDown.appendChild(actionButton);
        var dropDown = document.createElement('div');
        dropDown.setAttribute('id','actionDropDownDiv');
        dropDown.setAttribute('style','display:none;');

        var actionObj = {};
        actionObj.AnalyzeImpact = labels.AnalyzeImpact;
        actionObj.SelectAndLinkCR = labels.SelectAndLinkToCR;
        actionObj.CreateAndLinkCR = labels.CreateAndLinkToCR;

        for(var i=0; i< Object.keys(actionObj).length; i++){
            var acionMenuItem = document.createElement('a');
            acionMenuItem.setAttribute('style','display:block;');
            acionMenuItem.innerHTML = actionObj[Object.keys(actionObj)[i]];
            acionMenuItem.setAttribute('id',Object.keys(actionObj)[i]);
            acionMenuItem.addEventListener(
                'click',
                function() { 
                    if(this.id == 'AnalyzeImpact'){
                        analyzeImpactHandler();
                    }else if(this.id == 'SelectAndLinkCR'){
                        openSearhAndLink();
                    }else if(this.id == 'CreateAndLinkCR'){
                        createLinkToNewCR();
                    }
                    document.getElementById('actionDropDownDiv').style.display = 'none';
                 },
                false
             );
            dropDown.appendChild(acionMenuItem);
        }
        actionDropDown.appendChild(dropDown);      
        document.getElementById('InlineVisualizationHeader').appendChild(actionDropDown);
        
        function toggleDropdown(){
            var actionDropDownDiv = document.getElementById('actionDropDownDiv');
            if(actionDropDownDiv.style.display == 'none')
                actionDropDownDiv.style.display = 'block';
            else
                actionDropDownDiv.style.display = 'none';
        
        }

        this._addHeaderButtons(header);

        var menus_div = this.in_div.append("div")
            .attr("class", "InlineVisualizationMenus");

        //
        // Controls

        this.ctrl_div = menus_div.append("div")
            .attr("class", "InlineVisualizationControls");

       /* if (!this.is_preview) {
            // Append exit full screen button
            this.exit_full_screen = this.top_div.insert("div", "div")
                .attr("class", "ExitVisualizationFullScreen");

            this.exit_full_screen
                .append("button")
                .attr("type", "button")
                .on("click", this._toggleVisualizationFullScreen.bind(this))
                .append("img")
                .attr({width: 20, height: 20})
                .attr("src", "/resource/1584531049000/santy_rf__CMDBVisualization/styles/default/images/general/png/hot/fullscreen_exit_32.png")
                .attr("alt", "Exit full-screen visualization");
        }

        

        this.ctrl_div
            .append("img")
            .attr("class", "ControlDivManualGroupKey")
            .attr("title", "Model and Group membership")
            .attr("alt", "Model and Group membership")
            .style({
                "vertical-align": "top",
                padding: "10px 0px 4px 6px",
                display : this.options.show_manual_groups !== "none" ? "inline" :"none"
            })
            .on("click", bindContext(this, this.showManualGroupsKey))
            .attr("src", this.options.images.manual_groups_normal)
            .attr("onmouseout", "this.src='" + this.options.images.manual_groups_normal + "';")
            .attr("onmouseover", "this.src='" + this.options.images.manual_groups_hot + "';");

        //
        // Key button
		*/
        this.ctrl_div
            .append("img")
            .attr("title", "Key")
            .attr("alt", "Key")
            .attr("style", "vertical-align: top; padding: 10px 0px 4px 6px;")
            .on("click", bindContext(this, this.showVizKey))
            .attr("src", this.options.images.help_normal)
            .attr("onmouseout", "this.src='" + this.options.images.help_normal + "';")
            .attr("onmouseover", "this.src='" + this.options.images.help_hot + "';");
			
			
		// Add side bar

        if (this.updateSideBarMenu !== undefined) {
            this.updateSideBarMenu();
        }
        this._constructElements();

        //
        // Zoom slider

        this._constructZoomSlider();
    },

    _constructElements : function () {
        "use strict";

        // Context menu

        this.context_menu_div = this.viz_container.append("div")
            .attr("class", "actionDropdownMenu")
            .attr("id", "vizContextMenu")
            .attr("style", "display:none");

        this.context_menu_items = this.context_menu_div.append("ul");
    },

    // Construct Zoom slider component
    //
    _constructZoomSlider : function () {
        "use strict";

        this.zoom_slider_div = this.in_div.append("div")
            .attr("class", "InlineVisualizationZoomSlider");

        this.zoom_slider_div
            .append("button")
            .text("+")
            .attr("type", "button")
            .attr("class", "InlineVisualizationZoomSliderButton")
            .on("click", bindContext(this, this.zoomIn));

        this.zoom_slider_div
            .append("div")
            .attr("class", "InlineVisualizationZoomSliderLine")
            .attr("id", "zoom_slider")
            .append("div")
            .attr("class", "InlineVisualizationZoomSliderHandler")
            .attr("id", "zoom_slider_handler");

        this.zoom_slider_div
            .append("button")
            .text("-")
            .attr("type", "button")
            .attr("class", "InlineVisualizationZoomSliderButton")
            .on("click", bindContext(this, this.zoomOut));

        this.zoom_slider_div
            .append("button")
            .attr("title", labels.RecenterAndZoom)
            .attr("type", "button")
            .attr("class", "InlineVisualizationZoomToFitButton")
            .attr("aria-label", "Recentre and fit screen")
            .on("click", bindContext(this, this.zoomToFit));
    },

    // Zoom slider functionality
    //
    _initZoomSlider: function (fit_zoom) {
        "use strict";

        this.zoom_slider = new Control.Slider("zoom_slider_handler",
            "zoom_slider", {
                axis     : "vertical",
                range    : $R(fit_zoom * 0.8, 2.5),
                onSlide  : this._handleZoomSliderChange.bind(this),
                onChange : this._handleZoomSliderChange.bind(this)
            });
    },

    _handleZoomSliderChange : function (value) {
        "use strict";

        var new_scale = 2.5 + this.fit_zoom * 0.8 - value;

        // Use toPrecision to deal with JS floating point (0.1 + 0.2 !== 0.3)
        if (this.zoom.scale().toPrecision(14) !== new_scale.toPrecision(14)) {
            this.changeZoom(new_scale, true);
        }
    },

    // Update zoom slider limits depending on fit_zoom
    //
    updateZoomSlider : function (fit_zoom) {
        "use strict";

        // Reset zoom limits with new fit_zoom value
        this.zoom_slider.range = $R(fit_zoom * 0.8, 2.5);

        // Set zoom slider to scale value
        this.setZoomSliderValue();
    },

    setZoomSliderValue : function () {
        "use strict";

        var value = 2.5 + this.fit_zoom * 0.8 - this.zoom.scale();
        if (this.zoom_slider.value !== value) {
            this.zoom_slider.setValue(value);
        }
    },

    // Remove a message in the center of the display, if one is set.
    // Safe to call when there's no message.
    //
    _clearMessage : function () {
        "use strict";

        if (this.message) {
            this.message.remove();
            this.message = undefined;
        }
    },

    // Simple function to set a message in the center of the display
    //
    _setMessage : function (message_text) {
        "use strict";

        // Remove any existing message
        this._clearMessage();

        // Add message to the center of the display
        this.message = this.svg.append("text")
            .attr("x", this.svg_width/2)
            .attr("y", this.svg_height/2)
            .attr("text-anchor", "middle")
            .attr("fill", "gray")
            .attr("id","setMessgeTxt")
            .text(message_text);

        // Wrap text, retaining the central positioning
        this.wrapText(this.message, this.svg_width/2,
                      this.svg_width/2, this.svg_height/2);
    },

    // Start the visualization (set window size, show a
    // starting message to the user, etc.).
    //
    start : function () {
        "use strict";

        if (this.options.show_big) {
            this.setBig();
        }
        else {
            this.setSmall();
        }

        this.svg = this.viz_container
            .append("svg")
            .attr("class", "softwareContextViz")
            .attr("pointer-events", "all");


        this.svg.on("wheel", function () {
           if(!this.in_div.node().hasClassName("InlineVisualizationActive") &&
              !this.full_screen) {

               d3.event.preventDefault(); // For IE
               d3.event.stopImmediatePropagation(); // For Chrome and FF

               var dy = d3.event.deltaY;

               if (d3.event.deltaMode === 1) {
                   // Firefox specifies delta in lines, not pixels. 40
                   // pixels per line seems to work ok.
                   dy *= 40;
               }

               window.scrollTo(0, window.pageYOffset + dy);
           }
        }.bind(this));

        this.resize();

        this.back_rect = this.svg.append("rect")
            .attr("class", "vizbackground")
            .attr("width", "100%")
            .attr("height", "100%");

        this._defineMarkers(this.svg);

        var MESSAGES =
            ["Jnvg sbe vg", "Pnyphyngvat njrfbzrarff", "Ureqvat pngf",
             "Ureqvat cebtenzzref", "Zhatvat qngn", "Frnepuvat haqre gur fbsn",
             "Pbafvqrevat gur zrnavat bs yvsr", "Fnvyvat nybat gur Gvqrjnl",
             "Cbaqrevat", "Jbaqrevat", "Qenjvat oybof naq yvarf",
             "Znxvat pbssrr", "Znxvat grn", "Cynlvat sbbfonyy", "Hzzzz",
             "Fgnegvat naljurer", "Fgnegvat fbzrjurer", "Uhagvat nneqinexf",
             "Xavggvat n obooyrung", "Phfgneq pernz jvgu lbhe phc bs grn?",
             "Ybbxvat sbe n fvyire yvavat", "Jnvgvat sbe n Qbhoyr Qrpxre",
             "Ba na Rnfgre Rtt uhag", "Jnvgvat sbe QnnF obbg",
             "Znxvat n Svfu Svatre fnaqjvpu"];

        var message_text = "Please wait";
        if (Math.random() > 0.98) {
            message_text = MESSAGES[Math.floor((Math.random() * MESSAGES.length))]
                .replace(/[a-zA-Z]/g, function (c) {
                    return String.fromCharCode(
                        (c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26
                    );
                });
        }

        this._setMessage(message_text + "...");

        //
        // Start loading the data

        this._requestInitialData();
    },

    // Request the initial data from the backend.
    //
    _requestInitialData : function () {
        "use strict";

        throw Error("Not implemented");
    },

    // Prevent accidentally loosing important changes by showing
    // a confirm dialog before navigating away. The dialog will only be shown
    // after potentially important changed have occurred.
    //
    subscribeOnSignificantChanges: function () {
        "use strict";

        var SIGNIFICANT_CHANGE_EVENTS = [
            this.EVENT_REMOVE_NODE,
            this.EVENT_REMOVE_LINK,
            this.EVENT_RESTORE_NODE,
            this.EVENT_REMOVE_SELECTED,
            this.EVENT_KEEP_SELECTED,
            this.EVENT_NOTE_ADD,
            this.EVENT_NOTE_EDIT,
            this.EVENT_NOTE_DELETE,
            this.EVENT_UNDO,
            this.EVENT_REDO,
            this.EVENT_CREATE_USER_COLLECTION,
            this.EVENT_CREATE_USER_HULL,
            this.EVENT_RENAME_USER_COLLECTION
        ];

        // Ignore changes for application models in view mode
        if (this.app_name && !this.app_mod_editor_mode) {
            return;
        }

        // Collection expand/collapse should only warn on page unload in Application modelling mode
        if (this.app_mod_editor_mode) {
            SIGNIFICANT_CHANGE_EVENTS.push(
                this.EVENT_EXPAND_COLLECTION,
                this.EVENT_COLLAPSE_COLLECTION,
                this.EVENT_EXTEND_MODEL,

                // In Application modelling the state of "Save Changes" button is dependant on
                // this.pending_changes value. So it should also be set to true in next cases.
                this.EVENT_CREATE_EXCLUSION_RULES,
                this.EVENT_DELETE_EXCLUSION_RULES,
                this.EVENT_UPDATE_SHARED_OVERRIDES
            );
        }

        // Tab into event system and listen for changes
        if (this.subscribeEventHandler !== undefined) {
            this.subscribeEventHandler(
                this.EVENT_HANDLER_SIGNIFICANT_CHANGES,
                [ "*" ],
                bindContext(this, function (event_name, data) {
                    // Only set pending changes if the event was a significant change
                    if (SIGNIFICANT_CHANGE_EVENTS.indexOf(event_name) !== -1) {
                        this.pending_changes = true;

                        if (this.app_mod_editor_mode) {
                            this._updatePendingChangesMarker();
                        }
                    }
                })
            );
        }

        window.onbeforeunload = bindContext(this, function () {
            var pending_removal_rules_exist    = false,
                pending_shared_overrides_exist = false;

            if (this.rules) {
                pending_removal_rules_exist = this.getPendingRules().length > 0;
                pending_shared_overrides_exist = this.getPendingSharedOverrides().length > 0;
            }

            if (this.pending_changes || pending_removal_rules_exist ||
                pending_shared_overrides_exist) {
                return "There are pending changes. Are you sure you wish to leave the page?";
            }
        });
    },

    // Add buttons to the head of the visualization window.
    //
    _addHeaderButtons : function (header) {
        "use strict";

        var buttons = header.append("div")
            .attr("class", "InlineVisualizationHeaderButtons")
            .style({ position: "absolute", top: "15px", right: "5px" });

        /*this.expand_btn = buttons
            .append("button")
            .attr("title", "Toggle size")
            .attr("type", "button")
            .on("click", bindContext(this, this.toggleSize))
            .append("img")
            .attr("alt", "+/-");

        if (!this.is_preview) {
            buttons
                .append("button")
                .attr("title", "Full Screen")
                .attr("class", "InlineVisualizationStartFullScreenButton")
                .attr("type", "button")
                .on("click", bindContext(this, this._toggleVisualizationFullScreen))
                .append("img")
                .attr({width: 11, height: 11})
                .attr("src", this.options.images.full_screen_normal)
                .attr("onmouseout", "this.src='" + this.options.images.full_screen_normal + "';")
                .attr("onmouseover", "this.src='" + this.options.images.full_screen_hot + "';")
                .attr("alt", "Full Screen");
        }*/

        return buttons;
    },

    _toggleVisualizationFullScreen: function (force_on) {
        "use strict";

        if (this.full_screen && !force_on) {
            // Going out of "full screen": allow zoom in to fit, and only
            // allow zoom out if the current zoom level fits the whole
            // visualization.
            var allow_zoom_out = this._getFitZoom() >= this.zoom.scale();

            this.full_screen = false;
            d3.select("body").classed("InlineVisualizationFullScreen", false);
            this.in_div.style("top", "auto");

            this.resize(true, allow_zoom_out);
            return;
        }

        this.full_screen = true;
        d3.select("body").classed("InlineVisualizationFullScreen", true);
        var nav_bar_bottom = 52; // hardcoded the height of header.
        this.in_div.style("top", nav_bar_bottom + "px");

        // Going "full screen": do a resize, but only allow zooming in to fit.
        // If the visualization is zoomed in and we go into "full screen",
        // it's probably because we want to be able to see more - a zoom out
        // would be unexpected.
        this.resize(true, false);
    },

    toggleVisualizationViewMode : function () {
        "use strict";
        this.options.view_mode = !this.options.view_mode;
    },

    _forceFullScreen : function() {
        "use strict";

        this._toggleVisualizationFullScreen(true);
        this.in_div.classed("InlineVisualizationActive", true);
        this.exit_full_screen.style("display", "none");
    },

    _forceInlineScreen : function () {
        "use strict";

        if (this.full_screen) {
            this._toggleVisualizationFullScreen();
        }
        this.in_div.classed("InlineVisualizationActive", false);
        this.exit_full_screen.style("display", null);
    },

    // Construct layout objects.
    //
    _constructLayout : function () {
        "use strict";

        // Remove any old message (like "Please wait")
        this._clearMessage();

        this._initControlObjects();

        this.dragMode();

        if (this.options.show_big) {
            this.svg.on("contextmenu", bindContext(this, this.showContextMenu));
        }

        this.container = this.svg.append("g");
        this.container_node = this.container.node();

        d3.select("body").on("keydown.zoom", bindContext(this, function() {
            if (this.mouse_over && !this.keyboard_input) {
                switch (d3.event.keyCode) {

                case 61:  // Main keyboard, Firefox
                case 187: // Main keyboard, Chrome & IE
                case 107: // Numeric keypad
                    this.zoomIn();
                    d3.event.preventDefault();
                    break;

                case 173: // Main keyboard, Firefox
                case 189: // Main keyboard, Chrome & IE
                case 109: // Numeric keypad
                    this.zoomOut();
                    d3.event.preventDefault();
                    break;
                }
            }
        }));

        // Groups containing the graph objects

        this._initGroupObjects();
    },

    _initControlObjects : function () {
        "use strict";

        this.force = cola.d3adaptor()
            .size( [ this.svg_width, this.svg_height ] )
            .avoidOverlaps(true)
            .handleDisconnected(true);

        this.zoom = d3.behavior.zoom()
            .size( [ this.svg_width, this.svg_height ] )
            .on("zoom", bindContext(this, this.redraw));
    },

    _initGroupObjects : function () {
        "use strict";

        // When changing this, update "reInit" method too!

        // The ids are just there to help people inspecting the DOM
        // know which groups they are looking at. Do not rely on them
        // to be unique!
        
        this.surrounds_group = this.container
            .append("g")
            .attr("id", "surrounds");

        this.links_group = this.container
            .append("g")
            .attr("id", "links");

        this.hulls_group = this.container
            .append("g")
            .attr("id", "hulls");

        this.clips_group = this.svg
            .append("defs");

        this.text_group = this.container
            .append("g")
            .attr("id", "labels")
            .attr("display", "none");

        this.nodes_group = this.container
            .append("g")
            .attr("id", "nodes");

        this.manual_group_indicators_group = this.container
            .append("g")
            .attr("id", "indicators");
    },

    // Construct visualization header title
    //
    _constructTitle : function () {
        "use strict";

        var views = this._getAvailableContextViews(),
            label = this.getContextLabel();

        // Clear title element
        this.title_span.html("");
		//this.title_span.text(this.viz_name);
		if(typeof(selectedInstanceName) != 'undefined'){
		    this.title_span.html("<span class='viz-name-block'>" + this.viz_name + " > "+ selectedInstanceName + "</span>");
        }else{
            this.title_span.html("<span class='viz-name-block'>" + this.viz_name + "</span>");
        }

        // Add dropdown to small visualization header
        /*if (!this.options.show_big && this.options.can_change_focus) {
            this.title_span.text(this.viz_name + " - ");

            var layout_menu_div = this.title_span
                .append("div")
                .attr("class", "InlineVisualizationFocusToggle actionDropdownHolder")
                .attr("id", "focusContextDropdownHolder")
                .on("mousedown", function() {
                    // Prevent dragging visualization dialog
                    d3.event.stopImmediatePropagation();
                });

            layout_menu_div
                .append("a")
                .attr("id", "focusContextDropdownLink")
                .attr("class", "closed")
                .attr("href", "javascript:autocloser.toggleHolder('focusContextDropdownLink','focusContextDropdown');")
                .text(label)
                .append("div")
                .attr("class", "InlineVisualizationFocusToggleArrow");

            var layout_menu_ul = layout_menu_div
                .append("div")
                .attr("id", "focusContextDropdown")
                .attr("class", "actionDropdownMenu")
                .attr("style", "display:none")
                .append("ul");

            views.forEach(function (item) {
                var is_current_view = item[0] === this.options.context_id;

                if (is_current_view) {
                    layout_menu_ul
                        .append("li")
                        .append("div")
                        .classed("currentAction", true)
                        .text(item[1]);
                }
                else {
                    layout_menu_ul
                        .append("li")
                        .append("button")
                        .attr("type", "button")
                        .classed("regularAction", true)
                        .text(item[1])
                        .on("click", bindContext(this, this.changeFocus, item[0]));
                }
            }, this);
        }
        else {
            this.title_span.text(this.viz_name + " - " + label);
        }*/
    },

    // Set text of the cursor tooltip and add appropriate handlers to the svg.
    //
    showVizCursorTooltip : function (text) {
        "use strict";

        var objref = this;

        this.cursor_tooltip.text(text);

        this.svg
            .on("mouseenter.tooltip", function () {
                objref.cursor_tooltip.style("display", "inline");
            })
            .on("mouseleave.tooltip", function () {
                objref.cursor_tooltip.style("display", "none");
            })
            .on("mousemove.tooltip", function () {
                var x = d3.event.clientX + 15,
                    y = d3.event.clientY - 10;

                objref.cursor_tooltip.style({
                    left : x + "px",
                    top  : y + "px"
                });
            });
    },

    // Hide the cursor tooltip and remove tooltip handlers from the svg.
    //
    hideVizCursorTooltip : function () {
        "use strict";

        this.svg.on(".tooltip", null);
        this.cursor_tooltip.style("display", "none");
        this.cursor_tooltip.text("");
    },

    // Tell if a node should be visible.
    // Idempotent: does not alter the node state.
    //
    nodeVisible : function (node) {
        "use strict";

        // A node is visible only if (generic visibility for all node kinds):
        //  - it's not removed AND
        //  - it's not hidden  AND
        //  - it's not fake

        if (!node) {
            return false;
        }

        var visible         = !(node.removed || node.hidden || node.fake),
            has_collections = this.isCollectionNode !== undefined,
            is_col_member   = has_collections && this.isCollectionMember(node),
            is_col_node     = has_collections && this.isCollectionNode(node),
            hidden_kind     = this.hidden_kinds[node.kind];

        if (is_col_member) {
            // A collection member is visible only if:
            // - its collection is expanded AND
            // - its kind is not hidden
            var collection = this.nodes_map[node.collection];

            visible = visible && !hidden_kind;

            if (collection) {
                // a collection might be in this.removed_nodes if it's removed
                // in an application model
                visible = visible && collection.expanded;
            }
        }

        if (is_col_node) {
            // A collection node is visible only if:
            // - it's not expanded AND
            // - all of its member kinds are not hidden
            // Note that collections can also be members of other collections.
            visible = visible && !node.expanded &&
                !this.collectionMemberKindsHidden(node);
        }

        if (!is_col_member && !is_col_node) {
            // An ordinary node is visible only if:
            // - its kind is not hidden
            visible = visible && !hidden_kind;
        }

        return visible;
    },

    // Update layout of nodes.
    //
    updateLayout : function () {
        "use strict";

        var objref          = this,
            new_vis_nodes   = [],
            new_vis_links   = [],
            has_collections = this.isCollectionNode !== undefined,
            collections_map = {};

        this.all_nodes.forEach(function(node) {
            node.visible = this.nodeVisible(node);

            if (node.visible) {
                new_vis_nodes.push(node);
            }

            if (has_collections && this.isCollectionNode(node)) {
                node.members.forEach(function (member_id) {
                    collections_map[member_id] = node.id;
                });
            }

        }, this);

        if (has_collections) {
            this._addCollectionLinks(collections_map);
        }

        this.all_links.forEach(function(link) {
            if (link.source === undefined || link.target === undefined) {
                link.source = this.nodes_map[link.src_id];
                link.target = this.nodes_map[link.tgt_id];
            }

            if (!link.length) {
                if (link.source && link.target &&
                    link.source.hull !== link.target.hull) {

                    // If the ends are in different hulls, push them
                    // further apart to give the hull a bit more room.
                    link.length = 2.5;
                }
                else {
                    link.length = 1;
                }
            }

            if (!link.removed && !link.fake &&
                link.source && link.source.visible &&
                link.target && link.target.visible &&
                link.source.id !== link.target.id) {

                new_vis_links.push(link);
            }
        }, this);

        this.vis_nodes = new_vis_nodes;
        this.vis_links = new_vis_links;
        var length_mul = this.showing_labels ? this.LABELS_LENGTH
                                             : this.NO_LABELS_LENGTH;

        // Note that this never removes any nodes from the force
        // object. Doing so causes it to fail randomly. Any removed or
        // hidden nodes are left in the layout, but disconnected and
        // hidden so they don't get in the way.

        // Lazily add nodes to the layout - only those that are visible.
        // Cola has problems when the identity of its nodes array changes, so we
        // only push nodes there.
        var force_nodes = this.force.nodes(),
            force_ids   = {};

        force_nodes.forEach(function (node) {
            force_ids[node.id] = node;
        });

        new_vis_nodes.forEach(function (node) {
            if (!force_ids[node.id]) {
                force_nodes.push(node);
            }
        });

        this.force
            .links(this.vis_links)
            .linkDistance(function(link) { return length_mul * link.length; })
            .defaultNodeSize(this.showing_labels ? this.LABELS_NODE_SIZE : this.NODE_SIZE);
    },

    // Get a sorted array of removed nodes that can be restored.
    // The sort order is ascending by removal timestamp, the "removed_seq"
    // property.
    //
    getNodesToRestore : function () {
        "use strict";

        if (!this.all_nodes) {
            return [];
        }

        // make sure that nodes that are explicitly not removed are not present
        // in the sidebar (data consistency guard)
        var not_removed = {};

        return this.all_nodes
                   .concat(d3.values(this.removed_nodes))
                   .map(function (n) {
                       if (!n.removed) {
                           not_removed[n.id] = true;

                           if (this.isCollectionNode && this.isCollectionNode(n) &&
                               !this.collectionMembersLoaded(n)) {
                               n.members.forEach(function (member_id) {
                                   not_removed[member_id] = true;
                               });
                           }
                       }

                       return n;
                   }, this)
                   .filter(function (node) {
                       // don't show individual removed collection members
                       // if a collection has been removed
                       var collection = (this.nodes_map[node.collection] ||
                                         this.removed_nodes[node.collection]),
                           collection_removed = (
                               this.isCollectionNode &&
                               !this.isCollectionNode(node) &&
                               node.collection &&
                               collection.removed
                           );

                       return !not_removed[node.id] && node.removed && !collection_removed;
                   }, this)
                   .sort(function (a, b) {
                       // Sort nodes by removed_seq (ascending order)
                       // to keep recently removed nodes on the top of the list
                       return a.removed_seq < b.removed_seq ? 1 : -1;
                   });
    },

    // Construct sidebar for removed nodes. Function basically fills container
    // with data concerning removed nodes.
    //
    _constructRemovedNodesSidebar : function (container) {
        "use strict";

        // Fill container element with nothing to restore information
        var indicate_empty = function () {
                container.html("").append("div")
                    .attr("class", "remove-sidebar-empty")
                    .text("No nodes have been removed yet");
            },

            // Callback function to run after nodes from a group of nodes were restored
            // or group of nodes was restored, removes a single node or a group of nodes from the DOM
            //
            // restore_options               - Object of next shape:
            // restore_options.node_group_by - same as node[group_by], undefined on group restore
            // restore_options.group_idx     - index of group, to find it by class name
            // restore_options.group_by      - for current value of group_by parameter of removed nodes panel
            onRestore = function(restore_options) {
                var nodes_to_restore   = this.getNodesToRestore(),
                    was_group_restored = !restore_options.node_group_by,
                    group_div          = d3.select(".removed-nodes-group_" + restore_options.group_idx),
                    nodes_left; // nodes left in group after single node restore action

                if (restore_options.node_group_by) {
                    d3.select(d3.event.target.parentNode).remove();

                    nodes_left = nodes_to_restore.filter(function(n) {
                        return n[restore_options.group_by] === restore_options.node_group_by;
                    });

                    // in case node was restored, verify if this was the last node in group
                    if (nodes_left.length === 0) {
                        // all nodes from groups are restores so full group is restored
                        was_group_restored = true;
                    }
                    // in other case more some nodes in group left, update a group nodes counter
                    else {
                        group_div.select(".vis-sidebar-menu-group__sub-name")
                            .text(this._getRemovedGroupDescription(nodes_left, restore_options.group_by));
                    }
                }

                if (was_group_restored) {
                    group_div.remove();
                }

                if (!nodes_to_restore.length) {
                    // restored last node - indicate that there are no remove nodes
                    indicate_empty();
                }
            };

        if (!this.getNodesToRestore().length) {
            indicate_empty();
            return;
        }

        var buttons = [
            {
                name     : "Time",
                sort_type: "removed_seq"
            }, {
                name     : "Kind",
                sort_type: "kind"
            }
        ],
        default_sort_type = this.selected_side_bar_removed_nodes_sort_type || buttons[0].sort_type,
        filter_element  = container
            .append("div")
            .classed({"removed-nodes-sidebar__filter": true})
            .append("div")
            .classed({"btn-group": true}),
        removed_nodes_list_element = container
            .append("div")
            .classed({"removed-nodes-sidebar__list": true});

        buttons.forEach(function (btn) {
            var filter_button = filter_element.append("button");

            filter_button.attr("type", "button")
                .text(btn.name)
                .classed({"btn-secondary": true, "active": btn.sort_type === default_sort_type})
                .on("click", bindContext(this, function () {
                    filter_element.selectAll("button")
                        .classed({"active": false});

                    filter_button.classed({"active": true});

                    this.selected_side_bar_removed_nodes_sort_type = btn.sort_type;

                    this._renderRemovedGroups(btn.sort_type, removed_nodes_list_element, onRestore);
                }));
        }, this);

        this._renderRemovedGroups(default_sort_type, removed_nodes_list_element, onRestore);
    },

    // Fill SideBar div html element with content corresponding to Removed Nodes
    // and Removal Rules.
    //
    // sidebar_div - d3.Selection over sidebar div html element
    //
    _showRemovedNodesSidebar : function (sidebar_div) {
        "use strict";

        // Check if the Rules mixin is in place. If it is - create tabs for
        // removed nodes and removal rules, otherwise fill sidebar only with
        // removed nodes.
        if (this.constructRemovalRulesSidebar) {
            var tabs = [];

            tabs.push({
                label: "Removed Nodes",
                build_tab_body: bindContext(this, this._constructRemovedNodesSidebar)
            });
            tabs.push({
                label: "Removal Rules",
                build_tab_body: bindContext(this, this.constructRemovalRulesSidebar)
            });

            this.createSideBarTabs(sidebar_div, tabs);
        }
        else {
            this._constructRemovedNodesSidebar(sidebar_div);
        }
    },
	
	_openFilterSideBar : function(sidebar_div) {
		var tabs = [];
        document.getElementById("viz-sidebar-menu-expand").style.width = "30%";
		tabs.push({
			label: labels.Classes,
			build_tab_body: bindContext(this, this._showShowHideSidebar)
		});
		tabs.push({
			label: labels.Relationships,
			build_tab_body: bindContext(this, this._showRelationShipSidebar)
		});
		
		this.createSideBarTabs(sidebar_div, tabs);
	},

    // Mark the "Removed Nodes" tab as active.
    //
    // should_open - flag to indicate if the tab should be opened after activation.
    //
    activateRemovedNodesTab : function (should_open) {
        "use strict";

        // If the side bar menu does exist AND the "Removed Nodes" menu expand is
        // tabbed, activate the "Removed nodes" tab.
        if (this.activateSideBarTab && this.constructRemovalRulesSidebar) {
            this.activateSideBarTab("Removed Nodes", 0, should_open);
        }
    },

    // Based on removed panel grouping property returns an object
    // with groups of nodes by same property (removed_seq or kind),
    // like: {Host: [...], SI: [..]}
    //
    // group_by - parameter by which to group nodes (removed_seq or kind)
    //
    _getGroupedRemovedNodes: function (group_by) {
        "use strict";
        var removed_nodes = this.getNodesToRestore(),
            grouped_removed_nodes = {};

        removed_nodes.forEach(function (node) {
            if (grouped_removed_nodes.hasOwnProperty(node[group_by])) {
                grouped_removed_nodes[node[group_by]].push(node);
            }
            else {
                grouped_removed_nodes[node[group_by]] = [node];
            }
        });

        return grouped_removed_nodes;
    },

    // Renders a list of removed groups into removed panel list element
    //
    // group_by          - parameter by which nodes are grouped (removed_seq or kind)
    // list              - d3 wrapper over DOM element where to render groups
    // onRestoreCallback - callback to run after group is restored
    //
    _renderRemovedGroups: function (group_by, list, onRestoreCallback) {
        "use strict";

        // Group removed nodes by the time of removal (group_by === "removed_seq")
        // or the node kind (group_by === "kind").
        // Resulting object has the following structure:
        // { group_key : [ group members (removed nodes) ] }
        // Group key can be either an integer in case of grouping by the "removed_seq"
        // attribute (undefined if the backend has set removed_seq to undefined
        // for some nodes) or string in case of grouping by the node kind.
        var grouped_removed_nodes          = this._getGroupedRemovedNodes(group_by),
            sorted_group_keys,
            convertRemovedSeqValueToNumber = function(val) {
                var num_value = parseInt(val, 10);

                // set to -1 in case removed_seq value is undefined (cases when removed_seq is not
                // received from server) to have such items at the end of removed nodes list
                if (isNaN(num_value)) {
                    num_value = -1;
                }

                return num_value;
            };

        list.html("");

        // Sort removed groups before rendering them.

        // In case we are sorting by "removed_seq" We need to supply our own compare function to
        // ensure that we'll receive proper sorting results in descending order
        if (group_by === "removed_seq") {
            // Grouped by the time of removal, group key is either an integer or undefined.
            sorted_group_keys = Object.keys(grouped_removed_nodes)
                // As Object.keys converted group key to strings, to get proper sorting results
                // we need to convert string to integers.
                .map(convertRemovedSeqValueToNumber)
                // Execute descending sort on integers
                .sort(function(a, b) {
                    return b - a;
                });

            // In case undefined key was turned into -1 previously to get proper
            // sorting results, we need to turn it back.
            if (sorted_group_keys[sorted_group_keys.length - 1] === -1) {
                sorted_group_keys[sorted_group_keys.length - 1] = undefined;
            }
        }
        else {
            // Grouped by the node kind, group key is a string.
            sorted_group_keys = Object.keys(grouped_removed_nodes).sort();
        }

        sorted_group_keys.forEach(function(key, idx) {
            var removed_nodes = grouped_removed_nodes[key],
                group,
                group_options = {
                    container     : list,
                    group_class   : "removed-nodes-group_" + idx,
                    collapsed     : true,
                    expandable    : true,
                    group_name    : this._humanizeRemovedNodesGroupName(group_by, key),
                    group_sub_name: this._getRemovedGroupDescription(removed_nodes, group_by),
                    group_actions : bindContext(this, function(container) {
                        container.append("div")
                        .classed({ "removed-node__restore": true })
                        .on("click", bindContext(this, function() {
                            d3.event.stopPropagation();
                            this._restoreNodesGroupAction(group_by, key);
                            onRestoreCallback.call(this, { group_idx: idx });
                        }));
                    })
                };

            group = this.createSideBarMenuGroup(group_options);

            this._renderRemovedNodes(removed_nodes, idx, group_by, group.body, onRestoreCallback);
        }, this);
    },

    // Converts timestamp of node remove (remove_seq) or node kind (kind) into human readable sting to be used
    // to display a group name either 'Software Instance' or '5 hours ago', also depending on selected group_by
    //
    // group_by - parameter by which nodes are grouped (removed_seq or kind)
    // group_key - removed nodes group key, that depending of a group_by,
    //             can be node kinds or Date of removing operation
    //
    _humanizeRemovedNodesGroupName: function(group_by, group_key) {
        "use strict";
        if (group_by === "kind") {
            return (this.options.icons || this.options.shapes)[group_key][0];
        }
        else if (group_by === "removed_seq") {
            return !isNaN(parseInt(group_key)) ?
                whenWasThat(((Date.now() - group_key)/1000).toFixed()) : "Some time ago";
        }

        throw ("Unknown 'group_by' property provided to '_humanizeRemovedNodesGroupName' " +
        "function. Expected 'kind' or 'removed_seq', got " + group_by);

    },

    // Specific to only grouping by 'remove_seq'. Generates and returns
    // a human readable group subtitle based on nodes in removed group
    //
    // nodes    - collection of objects representing each node data in particular group
    // group_by - parameter by which nodes are grouped (removed_seq or kind)
    //
    _getRemovedGroupDescription: function(nodes, group_by) {
        "use strict";
        var countedNodeKinds = countBy(nodes, "kind"),
            removedKinds = Object.keys(countedNodeKinds),
            plural = nodes.length > 1 ? "s" : "",
            text;

        if (group_by === "removed_seq" && removedKinds.length === 1) {
            // all removed nodes in group are of same kind
            text = nodes.length + " " + (this.options.icons || this.options.shapes)[removedKinds[0]][0] + plural;
        }
        else {
            text = nodes.length + " node" + plural;
        }

        return text;
    },

    // Orders removed nodes within a given group.
    //
    // nodes    - group of removed nodes.
    // group_by - grouping parameter (removed_seq or kind).
    //
    _orderRemovedNodesWithinGroup : function (nodes, group_by) {
        "use strict";

        var orderByName = function (a, b) {
                if (a.short_name.toLowerCase() > b.short_name.toLowerCase()) { return  1; }
                if (b.short_name.toLowerCase() > a.short_name.toLowerCase()) { return -1; }

                return 0;
            },
            orderByKindAndName = function (a, b) {
                if (a.kind > b.kind) { return  1; }
                if (b.kind > a.kind) { return -1; }

                return orderByName(a, b);
            };

        if (group_by === "removed_seq") {
            // In case nodes are grouped by the time of removal, order them
            // by node kind AND short name...
            return nodes.sort(orderByKindAndName);
        }

        // ...otherwise just order them by short name.
        return nodes.sort(orderByName);
    },

    // Renders a removed nodes from provided group into a html group element
    //
    // nodes              - collection of objects representing each node data in particular group
    // group_idx          - index of a group in removed groups Array
    // group_by           - parameter by which nodes are grouped (removed_seq or kind)
    // group_body_element - d3 wrapper over DOM element where to render removed group nodes
    // onRestoreCallback  - callback to run after node is restored
    //
    _renderRemovedNodes: function(nodes, group_idx, group_by, group_body_element, onRestoreCallback) {
        "use strict";

        var ordered_nodes = this._orderRemovedNodesWithinGroup(nodes, group_by);

        ordered_nodes.forEach(function(node) {
            var node_div = group_body_element.append("div")
                .classed({ "vis-sidebar-menu-list-item": true, "removed-node": true });

            var icon_div = node_div.append("div")
                .classed({ "removed-node__icon": true });

            icon_div.node().appendChild(this.createNodeIconElement(node.kind, false));

            node_div.append("div")
                .classed({ "removed-node__restore": true })
                .on("click", bindContext(this, function () {
                    var node_grouping_value = node[group_by];
                    d3.event.stopPropagation();
                    this._restoreNodeAction(node);
                    onRestoreCallback.call(this, {node_group_by: node_grouping_value, group_idx: group_idx, group_by: group_by});
                }));

            if (this.isCollectionNode && this.isCollectionNode(node)) {
                var restore_count = this.getCollectionMembersToRestore(node).length;

                if (!this.collectionMembersLoaded(node)) {
                    // if all collection members haven't been loaded,
                    // we need to sum members to restore and existing members
                    restore_count += node.members.length;
                }

                node_div.append("div")
                    .classed({"removed-node__group-count": true})
                    .text(restore_count);
            }

            node_div.append("div")
                .classed({"removed-node__name": true, "nowrap-line": true})
                .text(node.short_name);

        }, this);
    },

    _restoreNodesGroupAction: function (grouping_parameter, group_idx) {
        "use strict";
        var grouped_removed_nodes = this._getGroupedRemovedNodes(grouping_parameter);

        this._restoreNodeAction(grouped_removed_nodes[group_idx]);
    },


    // Restore a removed node - UI action.
    //
    _restoreNodeAction : function (node) {
        "use strict";

        this.restoreNode(node);
        this._handleRestoreNode(node);
    },

    // Push event to event pump after a node has been restored.
    //
    _handleRestoreNode : function (node) {
        "use strict";

        if (this.pushEvent) {
            this.pushEvent(this.EVENT_RESTORE_NODE, {
                undone      : false,
                node        : node,
                removed_seq : node.removed_seq,
                undo        : function (data) {
                    data.node.removed_seq = data.removed_seq;
                    this.removeNode(data.node);

                    return true;
                },
                redo        : function (data) {
                    this.restoreNode(data.node);

                    return true;
                }
            });
        }
    },
	
	_showRelationShipSidebar : function (sidebar_div) {
        "use strict";

		var menu_items   = [];
		var objref       = this;

        // Section name
        // this.createSideBarSection(sidebar_div);

        // Create a sorted list of stuff we want to see
        this.all_links.forEach(function (link) {
            if(link.type && link.type != '' && link.target.visible && link.source.visible){ //don't show such relationships name in filter which have been removed from the graph
            	menu_items.push([ link.type, link.rel_id ]);
            }
        });
        menu_items.sort();

        var tbody = sidebar_div.append("table")
            .attr("class", "sideBarDropdownTable")
            .append("tbody");

        // Insert the table

        var tr_dat = tbody
            .selectAll("tr")
            .data(menu_items, function(d) { return d[0]; });

        var trs = tr_dat
            .enter()
            .append("tr")
            .on("click", bindContext(this, function(d) {
				var sel =  document.getElementById("showHideInput_" + d[1]);//d3.select("input[id=showHideInput_" + d[1] + "]"),
                // checked = sel.property("checked");
				var checked = JSON.parse(sel.getAttribute("checked"));
				if (d3.event.target.tagName.toLowerCase() !== "input") {
                    // tr has been clicked, toggle the checkbox
                    checked = !checked;
                    // sel.property("checked", checked);
					sel.setAttribute("checked", checked);
					if(checked) {
						document.getElementById('checkbox_div_showHideInput_' + d[1]).classList.add("checked");
					} else {
						document.getElementById('checkbox_div_showHideInput_' + d[1]).classList.remove("checked");
					}
                }
				this.removeLinks(d[0], checked);
            }));

        tr_dat
            .exit()
            .remove();

        trs.each(function(d) {

            var tr = d3.select(this),
                input_id = "showHideInput_" + d[1];
			var checkBoxChecked = false;
			objref.all_links.forEach(function(link) {
				if(link.type === d[0] && link.removed === true) {
					checkBoxChecked = true;
				}
			});
            var checkBox = tr.append("td");
			checkBox.append("input")
				.attr("type", "checkbox")
				.attr("id", input_id)
				.attr("class", "relation-checkbox")
				.attr("checked", !checkBoxChecked);
					
			checkBox.append("div")
				.attr("class", "checkbox-container " + ((!checkBoxChecked) ? 'checked' : ''))
				.attr("id", "checkbox_div_" + input_id);
				
			
			tr.append("td")
				.style("text-align", "left")
				.text(d[0]);
        });
    },
	
	removeLinks : function (d, isShowLink) {
        "use strict";

        // Get all links with the same rel_id and make sure they are removed
        // (there may be multiple links with the same rel_id because of
        //  collections).

        var links = this.all_links.filter(function (link) {
            return link.type === d;
        });

        // removed = true for all links (undefined -> no callback)
        this._setVisibilityFlag(links, !isShowLink, false);
        this.refreshLayout();
    },

    _showShowHideSidebar : function (sidebar_div) {
        "use strict";
		var objref = this;
        // Section name
        // this.createSideBarSection(sidebar_div);
		if(showClassFilterDropDown) {
            var class_filter_container = sidebar_div.append("div")
                .attr("class", "vis-sidebar-menu-class-filter");
            class_filter_container.append("span")
                .attr("class", "class-filter-label")
                .text("Filter by");
            var class_filter_select = class_filter_container.append("select")
                .attr("class", "vis-sidebar-menu-select class-filter-select")
                .on("change", bindContext(this, function () {
                    objref.classType = d3.event.target.value;
                    var localNodeToRemove = {};
                    this.all_nodes.forEach(function(node) {
                        if(node.instType !== objref.classType && node.instType !== "CI / Asset" && objref.classType !== "All") {
                            localNodeToRemove[node.id] = node;
                        }
                    });
                    if(Object.keys(nodeToRestore).length > 0) {
                        this.restoreNode(d3.values(nodeToRestore));
                    }
                    if(Object.keys(localNodeToRemove).length > 0) {
                        nodeToRestore = {};
                        nodeToRestore = localNodeToRemove;
                        this.removeNode(d3.values(localNodeToRemove));
                    }
                    
                    renderClassesList(objref);
                }));

            // Create hidden selected option as a placeholder for selection element
            class_filter_select.append("option")
                .attr("disabled", "disabled")
                .attr("selected", true)
                .text(objref.classType)
                .style("display", "none");

            ["All", "CI", "Asset"].forEach(function (item) {
                class_filter_select.append("option")
                    // Data in value attribute stores as string
                    // Save value as JSON string to parse it back on select
                    .attr("value", item)
                    .attr("class", "class-filter-option")
                    .text(item);
            });
        }    
		renderClassesList(objref, sidebar_div);
    },
	
	_buildManualGroupsSidebarSection : function (sidebar_div) {
        "use strict";

        var manual_groups_visibility_config = [
                {
                    label: "Do not show",
                    icon: this.options.images.manual_groups_none,
                    group_display_vis: "none"
                },
                {
                    label: "Show indicators",
                    icon: this.options.images.manual_groups_indicator,
                    group_display_vis: "indicator"
                },
                {
                    label: "Show labels",
                    icon: this.options.images.manual_groups_label,
                    group_display_vis: "label"
                }
            ],
            manual_group_section_div = d3.select(document.createElement("div"));

        this.createSideBarSection(sidebar_div, "Model Definitions and Manual Groups");

        manual_groups_visibility_config.forEach(function (config_item) {
            this.createSideBarButton(sidebar_div, config_item.icon, config_item.label,
                bindContext(this, this.toggleManualGroupLabels, config_item.group_display_vis),
                (config_item.group_display_vis === this.options.show_manual_groups ?
                    "vis-sidebar-menu-list-item_selected" : ""));
        }, this);

        sidebar_div.node().appendChild(manual_group_section_div.node());
    },

    _buildSurroundsSidebarSection : function(sidebar_div) {
        "use strict";

        var surrounds_config = [
            {
                label: "No shading",
                icon: this.options.images.surrounds_none,
                surround_type: null
            },
            {
                label: "Locations and Cloud Regions",
                icon: this.options.images.surrounds_location,
                surround_type: "location"
            },
            {
                label: "Node colors",
                icon: this.options.images.surrounds_node,
                surround_type: "node"
            },
            {
                label: "Application Model updates",
                icon: this.options.images.surrounds_model_updates,
                surround_type: "user_saved"
            }
        ],
            surround_selection_div = d3.select(document.createElement("div")),
            surrounds_used = {};

        // What surrounds are in use?
        this.vis_nodes.forEach(function(node) {
            if (node.color_info) {
                d3.keys(node.color_info).forEach(function(t) {
                    surrounds_used[t] = null;
                });
            }
            // user_saved is special
            if (node.user_saved !== undefined)
                surrounds_used["user_saved"] = null;
        });

        if (d3.keys(surrounds_used).length === 0)
            return;
        
        this.createSideBarSection(sidebar_div, "Background shading");

        surrounds_config.forEach(function(config_item) {
            if (config_item.surround_type in surrounds_used ||
                config_item.surround_type === null) {
                this.createSideBarButton(sidebar_div, config_item.icon, config_item.label,
                                         bindContext(this, this.setSurroundType, config_item.surround_type),
                                         (config_item.surround_type === this.options.surround_type ?
                                          "vis-sidebar-menu-list-item_selected" : ""));
            }
        }, this);
        sidebar_div.node().appendChild(surround_selection_div.node());
    },

    
    // Return the current context as a human-readable string.
    //
    getContextLabel : function () {
        "use strict";

        var i, item;

        for (i = 0; i < tw.viz.CONTEXT_LABELS.length; i++) {
            item = tw.viz.CONTEXT_LABELS[i];
            if (String(item[0]) === String(this.options.context_id)) {
                return item[1];
            }
        }

        for (i = 0; i < this.options.extra_focus.length; i++) {
            item = this.options.extra_focus[i];
            if (String(item[0]) === String(this.options.context_id)) {
                return item[1];
            }
        }

        return tw.viz.CONTEXT_LABELS[0][1];
    },

    _getAvailableContextViews : function () {
        "use strict";

        var ret;
        if (this.options.can_change_focus) {
            ret = tw.viz.CONTEXT_LABELS;
        }
        else {
            ret = [];
        }

        if (this.options.extra_focus.length > 0) {
            ret = ret.concat(this.options.extra_focus);
        }

        return ret;
    },

    _showFocusSidebar : function (sidebar_div) {
        "use strict";

        if (this.createSideBarButton === undefined) {
            console.log("Internal Error: Can't add sidebar buttons without sidebar mixin");
            return;
        }

        if (this.options.can_change_focus) {
            var views = this._getAvailableContextViews();

            if (views.length > 1) {
                this.createSideBarSection(sidebar_div, "Focus");

                views.forEach(function (item) {
                    this.createSideBarButton(sidebar_div, item[2], item[1],
                        bindContext(this, this.changeFocus, item[0]),
                        "focus-change " + (item[0] === this.options.context_id ?
                            "vis-sidebar-menu-list-item_selected" : ""));
                }, this);
            }
        }

        this._buildSurroundsSidebarSection(sidebar_div);
        this._buildManualGroupsSidebarSection(sidebar_div);
    },

    changeFocus : function(which) {
        "use strict";

        // Strip out old vizcontext and ignore the hash anchor
        var oldurl = window.location.href.split("#")[0].replace(/&vizcontext=[0-9]+/, "");

        // We need the _formMode_ to make the node plugin process the request
        //Commented below line because of issue reported in Fortify scan & the method is currentnly not in used, if needed in future below line needs to be uncommented.
        //window.location.href = oldurl + "&_formMode_=VIEW&vizcontext=" + which;
    },

    _getAvailableLayouts : function () {
        "use strict";

        var ret = [
            [ 0, labels.ForceDirected, this.options.images.force_directed ]
        ];

        // Always add Impact layout at present
        ret.push([ 1, labels.Impact, this.options.images.viz_impact ]);

        if (this.has_depth) {
            // Add Root at top layout to menu only if some nodes have depths
            ret.push([ 2, "Root at top", this.options.images.viz_rootattop ]);
        }

        return ret;
    },

    _getAvailableRouting : function() {
        "use strict";

        return [
            [ 0, labels.Direct,      this.options.images.viz_direct_rels ],
            [ 1, labels.Orthogonal,  this.options.images.viz_ortho_rels ],
            [ 2, labels.AvoidNodes, this.options.images.viz_avoiding_rels ],
        ];
    },

    _showLayoutSidebar : function (sidebar_div) {
        "use strict";

        var layouts = this._getAvailableLayouts(),
            routing = this._getAvailableRouting();

        if (this.createSideBarButton === undefined) {
            console.log("Internal Error: Can't add sidebar buttons without sidebar mixin");
            return;
        }

        // Wide/tall switch is only enabled when doing
        // force directed layout

        if (this.options.layout == 0) {
            this.createSideBarButton(sidebar_div,
                this.options.images.rotate_axes,
                labels.RotateViews,
                bindContext(this, function () {
                    if (this.options.layout === 0) {
                        this.transpose(true);
                    }
                }),
                "layout-switch",
                this.options.layout !== 0 ?
                    "This option is available in Force-directed layout only" : undefined);
        }
        else if (this.options.layout == 1) {
            this.createSideBarSection(sidebar_div, labels.CMDBImpactDirection);

            var objref = this,
                span = sidebar_div.append("span"),
                classes = "vis-sidebar-menu-list-button-item";

            span.append("button").attr("type", "button")
                .on("click", function() {
                    objref.options.impact_direction = "BT";
                    objref.changeLayout(1);
                })
                .attr("class", classes + " arrow-btn")
                .append("img")
                .attr("src", this.options.images.arrow_up)
                .attr("role",  "menuitem")
                .attr("alt",   "impact upwards")
                .attr("title", labels.ImpactUpwards);

            span.append("button").attr("type", "button")
                .on("click", function() {
                    objref.options.impact_direction = "LR";
                    objref.changeLayout(1);
                })
				.attr("class", classes + " arrow-btn")
                .append("img")
                .attr("src", this.options.images.arrow_right)
                .attr("role",  "menuitem")
                .attr("alt",   "impact to the right")
                .attr("title", labels.ImpactRight);

            span.append("button").attr("type", "button")
                .on("click", function() {
                    objref.options.impact_direction = "TB";
                    objref.changeLayout(1);
                })
                .attr("class", classes + " arrow-btn")
                .append("img")
                .attr("src", this.options.images.arrow_down)
                .attr("role",  "menuitem")
                .attr("alt",   "impact downwards")
                .attr("title", labels.ImpactDown);

            span.append("button").attr("type", "button")
                .on("click", function() {
                    objref.options.impact_direction = "RL";
                    objref.changeLayout(1);
                })
                .attr("class", classes + " arrow-btn")
                .append("img")
                .attr("src", this.options.images.arrow_left)
                .attr("role",  "menuitem")
                .attr("alt",   "impact to the left")
                .attr("title", labels.ImpactLeft);
        }

        this.createSideBarSection(sidebar_div, labels.Layout);

        layouts.forEach(function(item) {
            this.createSideBarButton(sidebar_div, item[2], item[1],
                bindContext(this, this.changeLayout, item[0]),
                "layout-change " + (item[0] === this.options.layout ?
                    "vis-sidebar-menu-list-item_selected" : ""));
        }, this);

        this.createSideBarSection(sidebar_div, labels.RelationshipRouting);

        routing.forEach(function(item) {
            this.createSideBarButton(sidebar_div, item[2], item[1],
                bindContext(this, this.changeRouting, item[0]),
                "routing-direction layout-change " + (item[0] === this.routing ?
                    "vis-sidebar-menu-list-item_selected" : ""));
        }, this);

        // - Disable BETA aggressive grouping for Aardvark

        //this.createSideBarSection(sidebar_div, "Beta");
        //
        //this.createSideBarButton(sidebar_div,
        //    this.options.images.showhide,
        //    "(BETA) normal/aggressive grouping",
        //    bindContext(this, function () {
        //        if (!window.confirm("This is an experimental feature. " +
        //                "\nTo change the grouping style, the page must reload, " +
        //                "so any changes you have made will be lost." +
        //                "\n\nProceed?")) {
        //            return;
        //        }
        //
        //        if (window.location.search.indexOf("&grouping=aggressive") !== -1) {
        //            // reloads the page
        //            window.location.search = (
        //                window.location.search.replace("&grouping=aggressive", "")
        //            );
        //        }
        //        else {
        //            // reloads the page
        //            window.location.search += "&grouping=aggressive";
        //        }
        //    }),
        //    "grouping-aggressive",
        //    this.app_mod_editor_mode === true ?
        //        "This option is disabled in Application Modelling Editor" : undefined
        //);
    },
	
	_openSettings: function(sidebar_div) {
		"use strict"
		
		// this.createSideBarSection(sidebar_div);
		document.getElementById("viz-sidebar-menu-expand").style.width = "600px";
		sidebar_div.append("iframe")
			.attr("src", "/apex/CIExplorerPage?isModernUI=true")
			.attr("frameborder", "0")
			.style("width", "100%")
			.style("height", "97%")
			.style("border", "1px solid white");
	},

    _showExportSidebar : function (sidebar_div) {
        "use strict";
        document.getElementById("viz-sidebar-menu-expand").style.width = "30%";

        if (this.createSideBarButton === undefined) {
            console.log("Internal Error: Can't add sidebar buttons without sidebar mixin");
            return;
        }

        // Add a select for print visualization in different page formats

        var print_container = sidebar_div.append("div")
            .attr("class", "vis-sidebar-menu-select");

        print_container.append("img")
            .attr("src", this.options.images.printer);

        var print_select = print_container.append("select")
            .attr("class", "vis-sidebar-menu-select")
            .on("change", bindContext(this, function () {
                var page = JSON.parse(d3.event.target.value);
                this.closeSideBarExtendPanel();
                this.printVisualization(page);
            }));

        // Create hidden selected option as a placeholder for selection element
        print_select.append("option")
            .attr("disabled", "disabled")
            .attr("selected", true)
            .text(labels.PrintVisualization)
            .style("display", "none");

        getPageFormats().forEach(function (item) {
            print_select.append("option")
                // Data in value attribute stores as string
                // Save value as JSON string to parse it back on select
                .attr("value", JSON.stringify(item))
                .text(labels.PrintVisualizationOn +" " + item.format);
        });


        // Take name of the application if it is available

        var filename = this.app_name !== undefined ? this.app_name : "graph";

        this.createSideBarButton(sidebar_div,
            this.options.images.svgexport,
            labels.ExportSVG,
            bindContext(this, function () {
                saveSvg(
                    d3.select("svg.softwareContextViz")[0][0],
                    filename + ".svg");
            }));

        // PNG export unsupported in all IE versions (even 10).
        // The saveSvgAsPng plugin uses: canvas.toDataURL("filename.png")
        // which results in JS error: "SCRIPT5022: SecurityError" in IE.

        this.createSideBarButton(sidebar_div,
            this.options.images.pngexport,
            labels.ExportPNG,
            bindContext(this, function () {
                saveSvgAsPng(d3.select("svg.softwareContextViz")[0][0],
                             filename + ".png", {scale: this.PNG_EXPORT_SCALE});
            }),
            "",
            tw.viz.isBrowserIE() ?
                labels.ExportNotInIE : undefined);
    },
	
	// Function to print visualization
    //
    // page - Object which holds the page format and size
    //
    printVisualization : function (page) {
        "use strict";

        // Create a fake element with page format height and width
        var page_el = d3.select("body")
                .append("div")
                .style("width",  page.size[0] - 30 + "mm")  // -30mm (margins)
                .style("height", page.size[1] - 30 + "mm"); // -30mm (margins)

        // Get page sizes in pixels
        var page_bounds = page_el.node().getBoundingClientRect(),
            page_w      = page_bounds.width,
            page_h      = page_bounds.height;

        // Define svg sizes and current graph coordinates
        var svg_w = this.svg_width,
            svg_h = this.svg_height,
            s     = this.zoom.scale(),
            x     = this.zoom.translate()[0],
            y     = this.zoom.translate()[1];

        // Compute minimal ratio between sides of page
        // and current svg rectangles to make svg bounds fit the page size
        var ratio = Math.min(page_w / svg_w, page_h / svg_h);

        // Multiply scale, x and y values by ratio to update graph bounds
        var page_scale = s * ratio,
            tx = x * ratio,
            ty = y * ratio;

        this.zoom.translate([tx, ty]).scale(page_scale);
        this.redraw(0, true);

        // Add print class to body
        // to let css hide all elements except visualization on a print dialog
        d3.select("body").classed("visualization-print-mode", true);

        page_el.remove();
        window.print();
    },

    // Add event handler on closing browser print window
    //
    addPrintDialogEventsHandler : function () {
        "use strict";

        var afterPrint = bindContext(this, function () {
            // Remove print class from body after print dialog has been closed
            d3.select("body").classed("visualization-print-mode", false);
            this.zoomToFit();
        });

        // Webkit and Opera do not support the onafterprint event and Gecko has its own idea of
        // the window.matchMedia API so we can't rely completely on either approach.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=774398
        // https://bugs.webkit.org/show_bug.cgi?id=19937
        if (Prototype.Browser.Gecko || Prototype.Browser.IE || Prototype.Browser.Edge) {
            window.onafterprint = afterPrint;
            return;
        }

        if (window.matchMedia) {
            var media_query_list = window.matchMedia("print");
            media_query_list.addListener(bindContext(this, function(mql) {
                if (!mql.matches) {
                    afterPrint();
                }
            }));
        }
    },

    // Get a navigable URL for a given node datum, suitable for use in "a"
    // elements.
    //
    // Might return a no-op URL "javascript:void(0)" for collections which
    // should be handled differently, using POST requests (see: navigateToNode).
    //
    getNodeLink : function (d) {
        "use strict";

        if (d.query) {
            return "Search?query=" + encodeURIComponent(d.query);
        }
        else if (d.members) {
            return "javascript:void(0)";
        }
        else if (d.kind === "BusinessApplicationInstance") {
            return "ApplicationView?nodeID=" + d.id +
                "&vizcontext=" + this.options.context_id;
        }
        else {
            return "InfrastructureView?nodeID=" + d.id +
                "&vizcontext=" + this.options.context_id;
        }
    },

    // Navigate the current browser window to the specified node.
    // If new_tab is true, opens a new tab/window instead.
    //
    navigateToNode : function (d, new_tab) {
        "use strict";

        if (d.members) {
            // Construct a new, hidden form element, then do a POST to /ui/Search.
            // Do this because collection "members" might not fit into one
            // GET query string.

            var query  = "lookup '" + d.members.join("','") + "'",
                form   = d3.select("body")
                           .append("form")
                           .style({"display": "none"})
                           .attr("method", "post")
                           .attr("action", "Search");

            if (new_tab) {
                form.attr("target", "_blank");
            }

            form.append("input")
                .attr("type", "hidden")
                .attr("name", "query")
                .attr("value", query);

            form.node().submit();
        }

        else {
            // Open a new tab if corresponding flag set to true. If it doesn't -
            // change the location url and stay on the current page
            if (new_tab) {
                window.open(this.getNodeLink(d), "_blank");
            }
            else {
                window.location.href = this.getNodeLink(d);
            }
        }
    },

    // Render transitions in the visualization.
    //
    // NOTE: The callback can be called synchronously if there were no
    //       asynchronous transitions.
    //
    updateSVG : function (initial, callback) {
        "use strict";

        var ender = this.endallMulti("updateSVG", function() {
            this._updateSVGComponents();
            if (callback !== undefined) {
                callback();
                var selectionCount = this.getSelectedIds().length;
                if(selectionCount != 1){
                    enableAnalyzeImpactButton(false);
                }else{
                    updateDetailHeader();
                    enableAnalyzeImpactButton(true);
                }        
                enableLinkMenuItem(selectionCount);
            }
        }.bind(this));

        this._updateSVGLinks(initial, ender);
        this._updateSVGHulls();
        this._updateSVGClips(initial, ender);
        this._updateSVGSurrounds(initial, ender);
        this._updateSVGNodes(initial, ender);
        this._updateSVGLabels(ender);
        this._updateSVGManualGroups(ender);

        // Update other SVG components
        this._updateSVGComponents(initial, ender);

        // Set things in motion
        this.tick();

        // If no transitions occurred, the ender function's counter will be 0,
        // and the callback won't be called - force it if needed.
        var not_fired = callback === undefined ? true : !ender.callbackFired();

        if (ender.getCounter() === 0 && not_fired) {
            this._updateSVGComponents();
            if (callback !== undefined) {
                callback();
            }
        }
    },

    _updateSVGLinks : function (initial, ender) {
        "use strict";

        var objref = this,
            fade_transition = this.FADE_TRANSITION,
            real_links = this.vis_links.filter(function(l) { return !l.fake; });

        var link_dat = this.links_group.selectAll("path")
            .data(real_links, function(l) { return l.id; });

        var link_add = link_dat
            .enter()
            .append("path")
            .attr("class", function(d) { return "link " + d.kind; })
			.style("stroke", function(d) { 
                if(d.fillColor){
                    if(d.fillColor.toLowerCase() == 'black')
                        return d.fillColor;
                    else
                        return ('#'+d.fillColor);
                }else{
                    return 'black';
                }
            })
			.style("stroke-width", function(d) { return parseInt(d.lineWeight) + 1 })
			.style("stroke-dasharray", function(d) {
				if(d.arrowType == 'Solid') {
					return 0;
				} else {
					return 5;
				}
			})
            .attr("marker-end", function(d) {
				if (d.style === "peer") {
                    return "none";
                }
                else {
                    return "url(#Unknown)";
                }
            }).on("dblclick.zoom", bindContext(this, this.zoomToFit));

        if (!initial) {
            link_add
                .style("opacity", 0)
                .transition().duration(fade_transition).style("opacity", 1)
                .call(ender, false, undefined, function (el) {
                    d3.select(el).style("opacity", 1);
                });
        }

        link_add.append("title").text(function(d) {
            return objref.options.relationships_map[d.kind] || d.kind;
        });

        link_dat
            .exit()
            .transition().duration(fade_transition).style("opacity", 0)
            .call(ender, true);
    },

    _updateSVGHulls : function () {
        "use strict";

        var hull_dat = this.hulls_group.selectAll("path")
            .data(d3.keys(this.hulls));

        var objref = this;
        
        hull_dat
            .enter()
            .append("path")
            .style("opacity", 0.25)
            .style("fill", function(h) {
                return objref._fetchManualGroupColor(h, h, "hull");
            });
    },

    _updateSVGClips : function(initial, ender) {
        "use strict";

        var objref          = this,
            fade_transition = objref.FADE_TRANSITION;
        
        this._setClipPaths();

        var clip_dat = this.clips_group.selectAll("clipPath")
            .data(d3.keys(this.clip_paths), function(d) { return d; });

        clip_dat
            .enter()
            .append("clipPath")
            .attr("id", function(d) { return "clip-" + d; })
            .append("path")
            .attr("d", this.clipPath.bind(this));

        clip_dat.exit()
            .transition()
            .duration(fade_transition)
            .call(ender, true);
    },

    hash : function(str) {
        var v = 13331, // prime number seed
            i = str.length;

        while (i)
            v = ((v<<5) ^ (v >>> 27)) ^ str.charCodeAt(--i);

        return v >>> 0; // Force positive result
    },
        
    _updateSVGSurrounds : function(initial, ender) {
        "use strict";

        var objref          = this,
            fade_transition = objref.FADE_TRANSITION,
            surround_size   = (this.options.show_big || this.options.layout === 1) ? this.BIG_SURROUND_SIZE : this.SMALL_SURROUND_SIZE,
            surround_type   = this.options.surround_type;

        var surround_dat    = this.surrounds_group.selectAll("circle")
            .data(this._nodesWithSurrounds(), function(n) { return n.id; });

        var surround_add    = surround_dat
            .enter()
            .append("circle")
            .attr("fill", function(n) {
                if (surround_type === "user_saved") {
                    if (n.user_saved)
                        return "#66f";
                    else
                        return "#b40";
                }
                var info = n.color_info[surround_type];

                if (info.color)
                    return info.color;

                if (info.label) {
                    return objref.surround_color_list[objref.hash(info.label) % objref.surround_color_list.length];
                }

                return "#f00";
            })
            .attr("fill-opacity", 0.25)
            .attr("clip-path", function(n) { return "url(#clip-" + n.id + ")"; });

        surround_add.append("svg:title")
            .text(function(n) {
                if (surround_type === "user_saved")
                    return n.user_saved ? "Saved by a user" : "Added by BMC Discovery";

                return n.color_info[surround_type].label;
            });
        
        if (initial) {
            surround_add
                .attr("r", surround_size)
                .style("opacity", 1);
        }
        else {
            surround_add
                .attr("r", 0)
                .style("opacity", 0)
                .transition().duration(fade_transition)
                .attr("r", surround_size)
                .style("opacity", 1);
        }
        
        surround_dat.exit()
            .transition()
            .duration(fade_transition)
            .attr("r", 0)
            .style("opacity", 0)
            .call(ender, true);
    },
        
    _updateSVGNodes : function (initial, ender) {
        "use strict";

        var objref          = this,
            drag_timer      = 0,
            drag_flag       = false,
            fade_transition = objref.FADE_TRANSITION;
			mainObjRef = this;
        var node_dat = this.nodes_group.selectAll("g")
            .data(this.vis_nodes, function(n) { return n.id; });

        var node_add = node_dat
            .enter();

        if (tw.viz.down_up_context === undefined) {
            tw.viz.down_up_context = {};
        }

        var drag = this.force.drag()
            .on("dragstart", function() {
                d3.event.sourceEvent.stopPropagation();
            })
            .on("drag", function () {

                // Chrome tends to fire false drag events (no offset)
                // which may confuse the onclick handler by assigning
                // a wrong value to the drag_timer.  Such events
                // should be ignored.
                if (d3.event.dx === 0 && d3.event.dy === 0) {
                    return;
                }

                var ct = Date.now();

                // Throttling of drag events - one every second

                if (ct - drag_timer > 1000) {
                    if (objref.pushEvent !== undefined) {
                        objref.pushEvent(objref.EVENT_NODE_DRAG, {
                            node : this
                        });
                    }
                    drag_timer = Date.now();
                }

                drag_flag = true;
            })
            .on("dragend", function () {
                if (drag_flag) {
                    drag_flag = false;
                    drag_timer = Date.now();
                }
            });

        node_add = node_add
            .append("g")
            .classed("viz-node", true)
            .call(drag)
			.attr("id", function (d) { return d.id})
            .on("click", function (d) {
				objref.toggleSelected(d, d3.select("#" + d.id));
            })
            .on("mousedown", function (d) {
                if (d3.event.button !== 0) {
                    d3.event.stopPropagation();
                    return;
                }
                // In IE mousedown on <use href="xlink:"> is handled as
                // a mousedown on element which xlink points to, this causes a
                // js error while dragging node, so we need to manually initiate
                // mousedown on a proper element

                // TODO remove this after d3 will be updated at least
                // to v3.5.15 as this is fixed in d3 v3.5.15
                // https://github.com/d3/d3/releases/tag/v3.5.15

                if ((Prototype.Browser.IE || Prototype.Browser.Edge) &&
                    d3.event.target.correspondingUseElement) {
                    d3.event.stopPropagation();
                    var e = document.createEvent("MouseEvents");
                    e.initMouseEvent("mousedown", true, true, window, 0, 0, 0,
                                     d3.event.clientX, d3.event.clientY, false,
                                     false, false, false, 0, null);
                    d3.event.target.correspondingUseElement.dispatchEvent(e);
                }

                tw.viz.down_up_context.last_datum = d;
                tw.viz.down_up_context.last_node  = this;
                objref.nodeMouseDown(d, this);
            }, true);

        d3.select(window)
            .on("mouseup", function (d) {
                if (tw.viz.down_up_context.last_datum !== undefined) {

                    var last_datum = tw.viz.down_up_context.last_datum,
                        last_node  = tw.viz.down_up_context.last_node;

                    tw.viz.down_up_context.last_datum = undefined;
                    tw.viz.down_up_context.last_node  = undefined;

                    objref.nodeMouseUp(last_datum, last_node);
                }
            });

        if (!initial) {
            node_add.style("opacity", 0);
        }

		this._constructNodesFromIcons(node_add);
		
        /*if (this.options.icons === undefined) {
            this._constructNodesFromSVGShapes(node_add);
        }
        else {
            this._constructNodesFromIcons(node_add);
        }*/
       

        const tooltip = d3.select('#tooltip').append("div")
  									.classed("tooltip nodeTooltip", true)
  									.style("opacity", 0); // start invisible
		  node_add
			.on("mouseover", function(d) {
				tooltip.transition().duration(300).style("opacity", 1); // show the tooltip
				tooltip.html(d.name)
				.style("left", (d3.event.pageX + 20 + "px"))
				.style("top", (d3.event.pageY + 30 + "px"));
                d3.select("#"+d.id).select(".nodeRunDiscovery").style("display", null);
			})
			.on("mouseleave", function(d) {
				tooltip.transition().duration(200).style("opacity", 0);
                d3.select("#"+d.id).select(".nodeRunDiscovery").style("display", "none");
            })
            
            node_add.on("dblclick", bindContext(this, function (d) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
    
                autocloser.forceClose(); // Need to close active sidebar menu item
    
                this.extendModel(d, d3.select('#'+d.id),
                    bindContext(this, this.getNewAndSuppressedNodesAndLinks),
                    undefined,
                    bindContext(this, this._showEphemeralMessageForNode, 
                        d, d3.select('#'+d.id), labels.NoMoreRelatedNodes));
            }))

        if (!initial) {

            // Restore old position of the node before it has been hidden
            node_add.each(function(node) {
                if (node.old_y !== undefined) {
                    node.y = node.old_y;
                    delete node.old_y;
                }
            });

            // Highlight added nodes if they belong to some highlighted set

            if (this.highlightNode !== undefined) {
                node_add.each(function (datum) {
                    var hs = datum.highlight_set;
                    if (hs) {

                        // Check if current set is highlighted

                        var set_is_highlighted = !node_dat
                            .filter(function (d) { return d.highlight_set === hs; })
                            .select("circle, rect")
                            .filter(".highlighted")
                            .empty();

                        if (set_is_highlighted) {
                            objref.highlightNode(this, hs, true);
                        }
                    }
                });
            }

            // Add nodes
            node_add
                .transition().duration(fade_transition).style("opacity", 1)
                .call(ender, false, undefined, function (el) {
                    d3.select(el).style("opacity", 1);
                });
        }

        this._updateAddedNodes(node_add, initial);

        // Remove nodes
        node_dat.exit()
            .transition()
            .duration(fade_transition)
            .style("opacity", 0)
            .call(ender, true, function(elem) {
                // Move the removed nodes outside the bounds of the
                // current layout.
                var n = d3.select(elem).datum();

                objref._moveNodeOutsideBounds(n);
            });

        if (!node_dat.data().first()) {
            // no nodes present - show "no data" message
            this._noData();
			this.closeKey();
        }
        else {
            // we have data: remove the message (no-op if there's no message)
            this._clearMessage();
        }
    },

    _noData : function () {
        "use strict";

        this._noDataGeneric();
    },

    _noDataGeneric : function () {
        "use strict";

        this._setMessage(labels.NoRecordsFound);
    },

    _updateSVGLabels : function (ender) {
        "use strict";

        if (this.showing_labels) {
            this.buildLabels(true, ender);
        }
        else if (this.options.show_labels) {
            this.showLabels();
        }
    },

    _updateSVGManualGroups : function (ender) {
        "use strict";

        if (this.options.show_manual_groups !== "none") {

            var fade_transition = this.FADE_TRANSITION,
                indicators_sel = this.manual_group_indicators_group.selectAll("g"),
                indicators_dat = indicators_sel.data(this.vis_nodes,
                    function(n) { return n.id; }),
                indicators_add = indicators_dat.enter().append("g");

            this._buildManualGroups(indicators_add);

            indicators_dat
                .exit()
                .transition().duration(fade_transition).style("opacity", 0)
                .call(ender, true);
        }
    },

    _constructNodesFromIcons : function(node_add) {
        "use strict";

        var objref  = this,
            hl_root = objref.options.highlight_root;

        node_add.each(function (d) {
            var g = d3.select(this);
            //var node_icon = objref.options.icons[d.kind] || objref.options.icons[""];
			var node_icon = getNodeIcon(d, objref);	
				
            g.append("rect")
                .attr("x", -9)
                .attr("y", -11)
                .attr("height", 28)
                .attr("width", 28)
                .attr("id",'rect_'+d.actualName)
                .classed("image-highlight", true)
                .classed("root-node selected", d.root && hl_root);

            g.append("image")
                .attr("xlink:href", node_icon)
                .attr("x", -8)
                .attr("y", -10)
                .attr("height", 24)
                .attr("width", 24)
                .attr("id",'img_'+d.actualName)
                .attr("class", d.kind + (d.root && hl_root ? " root" : ""));

            d.node_icon_width = objref.NODE_SIZE;
			if (objref._constructExtendButtonForEachNode) {
                objref._constructExtendButtonForEachNode(d, g);
            }
        });
    },

    _constructCollectionNodeFromSVGShape : function (datum, node) {
        "use strict";

        var objref             = this,
            visible_kinds      = Object.keys(datum.member_kinds).filter(function (kind) {
                return !objref.hidden_kinds[kind];
            }),
            primary_kind       = datum.kind in this.hidden_kinds ? visible_kinds[0] : datum.kind,
            root_class         = datum.root && this.options.highlight_root ? " root" : "",
            shared_class       = this.options.highlight_shared && this.sharedValueForNode &&
                (this.sharedValueOverriddenForNode(datum) || this.sharedValueForNode(datum)) ? " shared"
                                                                                             : "",
            node_class_name    = "node_bg" + root_class + shared_class,
            width              = 5,
            kinds_array        = visible_kinds,
            primary_kind_index = kinds_array.lastIndexOf(primary_kind);

        // In order to make primary icon first
        //
        if (primary_kind_index > 0) {
            kinds_array = kinds_array.splice(primary_kind_index, 1).concat(kinds_array);
        }

        // Loop over collection member kinds in order to build an icon set
        // that consists from "node_kind amount" followed by a "node_kind icon"
        //
        for (var i = 0, l = kinds_array.length; i < l; i++) {
            var member_kind       = kinds_array[i],
                member_node_icon  = member_kind in this.options.shapes ? "#n_" + member_kind
                                                                       : "#n_",
                member_node_count = datum.member_kinds[member_kind];

            var t = node.append("text")
                .attr("x", width)
                .attr("y", 4)
                .attr("text-anchor", "start")
                .attr("class", "groupcount " + member_kind + "-group")
                .text(member_node_count);

            width += 8 + Math.ceil(t.node().getBBox().width);

            var u = node.append("use")
                .attr("x", width)
                .attr("xlink:href", member_node_icon);

            width += 2 + Math.ceil(u.node().getBBox().width);
        }

        node.selectAll("text, use")
            .attr("x", function () {
                return d3.select(this).attr("x") - width / 2;
            });

        node.insert("rect", ":first-child")
            .attr("x", -width / 2)
            .attr("y", -this.NODE_SIZE / 2)
            .attr("width", width)
            .attr("height", this.NODE_SIZE)
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("class", node_class_name);

        datum.node_icon_width = width;
    },

    _constructNodesFromSVGShapes : function (node_add) {
        "use strict";

        var objref = this;

        node_add.each(function (d) {

            var g               = d3.select(this),
                root_class      = (d.root && objref.options.highlight_root ? " root" : ""),
                shared_class    = objref.options.highlight_shared && objref.sharedValueForNode &&
                    (objref.sharedValueOverriddenForNode(d) || objref.sharedValueForNode(d)) ? " shared"
                                                                                             : "",
                node_class_name = "node_bg" + root_class + shared_class,
                node_icon       = d.kind in objref.options.shapes ? "#n_" + d.kind : "#n_",
                is_collection   = objref.isCollectionNode && objref.isCollectionNode(d);

            if (is_collection) {
                objref._constructCollectionNodeFromSVGShape.call(objref, d, g);
            }
            else {
                g.append("circle")
                    .attr("r", 10)
                    .attr("class", node_class_name);

                d.node_icon_width  = objref.NODE_SIZE;

                g.append("use")
                    .attr("xlink:href", node_icon);
            }

            if (objref._constructExtendButtonForEachNode) {
                objref._constructExtendButtonForEachNode(d, g);
            }
        });
    },

    _constructManualGroupIndicators : function (g, d) {
        "use strict";

        if (!d.manual_groups && !d.model_defs) {
            return;
        }

        var node_groups = d.manual_groups.concat(d.model_defs);

        for (var i = 0, l = node_groups.length; i < l; i++) {
            var group = node_groups[i],
                group_type = i < d.manual_groups.length ? "manual_group" : "model_def",
                x_start = (d.node_icon_width - this.NODE_SIZE)/ 2,
                shape;

            if (i === this.max_manual_groups_display && group) {
                g.append("text")
                    .attr("x", x_start + this.NODE_SIZE/2 * (i + 1) - 4)
                    .attr("y", this.NODE_SIZE/2 - 2)
                    .attr("text-anchor", "start")
                    .style("cursor", "default")
                    .text("...")
                    .append("title")
                    .text(bindContext(this, this._constructRestManualGroupsTooltip, d));

                break;
            }

            if (group_type === "manual_group") {
                shape = g.append("circle")
                    .attr("cx", x_start + this.NODE_SIZE/2 * (i + 1))
                    .attr("cy", this.NODE_SIZE/4)
                    .attr("r", 4);
            }
            else {
                var points = [
                    (x_start + this.NODE_SIZE/2 * (i + 1) - 4.5) + "," + (this.NODE_SIZE/4 + 4),
                    (x_start + this.NODE_SIZE/2 * (i + 1)) + "," + (this.NODE_SIZE/4 - 4),
                    (x_start + this.NODE_SIZE/2 * (i + 1) + 4.5) + "," + (this.NODE_SIZE/4 + 4)
                ];

                shape = g.append("polygon")
                    .attr("points", points.join(" "));
            }

            shape.style({
                "stroke": "#fff",
                "stroke-width": "1px",
                "fill": this._fetchManualGroupColor(group.id, group.name, group_type)
            });

            shape.append("title")
                .text(group.name +  (group.favourite ? " (Favorite)" : ""));
        }
    },

    _constructManualGroupLabels : function (g, d) {
        "use strict";

        if (!d.manual_groups && !d.model_defs) {
            return;
        }

        var node_groups = d.manual_groups.concat(d.model_defs),
            groups_count = node_groups.length,
            groups_max   = this.max_manual_groups_display,
            y_start      = (groups_count > groups_max ? groups_max : (groups_count - 1)) * 12 + 2;

        for (var i = 0, l = node_groups.length; i < l; i++) {
            var group       = node_groups[i],
                group_type  = i < d.manual_groups.length ? "manual_group" : "model_def",
                last_group  = i === groups_max,
                group_title = last_group ? "..." : group.name + (group.favourite ? " (Favorite)" : ""),

                text        = g.append("text")
                    .attr("x", d.node_icon_width/2 + 2)
                    .attr("y", (this.NODE_SIZE/2 + 2) * i + 9 - y_start)
                    .attr("fill", "#fff")
                    .style("cursor", "default")
                    .attr("font-size", "8px")
                    .attr("text-anchor", "start")
                    .text(group_title);

            g.insert("rect", "text")
                .attr("x", d.node_icon_width/2)
                .attr("y", (this.NODE_SIZE/2 + 2) * i - y_start)
                .attr("width", Math.ceil(text.node().getBBox().width) + 5)
                .attr("height", "12")
                .attr("stroke", "#fff")
                .attr("stroke-width", "1px")
                .attr("fill", last_group ? "#ccc" : this._fetchManualGroupColor(group.id, group.name, group_type));

            text.append("title")
                .text(last_group ? bindContext(this, this._constructRestManualGroupsTooltip, d) : group_title);

            if (last_group) {
                break;
            }
        }
    },

    _constructRestManualGroupsTooltip: function (d) {
        "use strict";

        var tooltip = d.manual_groups.concat(d.model_defs)
            .slice(this.max_manual_groups_display)
            .map(function(grp){
                return " - " + grp.name + (grp.favourite ? " (Favorite)" : "");
            });

        if (tooltip.length > d.model_defs.length) { // Manual groups are at the beginning of tooltip
            tooltip.unshift("Manual Groups:");
            // tooltip contains also model definitions
            if (d.model_defs.length) {
                tooltip.splice(-d.model_defs.length, 0, "\nModel Definitions:");
            }
        }
        else {
            tooltip.unshift("Model Definitions:"); // only Model Definition in tooltip
        }

        return tooltip.join("\n");
    },

    _fetchManualGroupColor: function (group_id, group_name, group_type) {
        "use strict";

        if (!this.manual_group_color_map[group_type]) {
            this.manual_group_color_map[group_type] = {};
        }

        var color_map = this.manual_group_color_map[group_type];

        if (!color_map[group_id]) {
            var color_idx = Object.keys(color_map).length;
            var color_val = this.manual_group_color_list[color_idx % this.manual_group_color_list.length];
            color_map[group_id] = {
                name  : group_name,
                color : color_val
            };
        }

        return color_map[group_id].color;
    },

    _updateAddedNodes : function (node_add, initial) {
        "use strict";
    },

    _updateSVGComponents : function (initial, ender) {
        "use strict";

        //
        // Update selections

        // be sure to change "reInit" method if modifying this!

        this.link_sel     = this.links_group.selectAll("path");
        this.hull_sel     = this.hulls_group.selectAll("path");
        this.clip_sel     = this.clips_group.selectAll("path");
        this.surround_sel = this.surrounds_group.selectAll("circle");
        this.node_sel     = this.nodes_group.selectAll("g");
        this.text_sel     = this.text_group.selectAll("text");
        this.manual_group_indicators_sel =
            this.manual_group_indicators_group.selectAll("g");
    },

    // Start the cola's layout process.
    //
    // If it's already started, perform the specified number of iterations
    // on demand.
    //
    // layout_iterations should be an array, one of the values in
    // options.layout_iterations
    //
    startLayout : function (layout_iterations) {
        "use strict";

        if (!layout_iterations) {
            layout_iterations = this.options.layout_iterations.default;
        }

        this.force.start.apply(this.force, layout_iterations);
    },

    // Prepare for setting visualization state. Constructs appropriate objects
    // for storing nodes / links / collections etc. Makes sure that layouting
    // is stopped, so that changing node data is safe.
    //
    // Returns: initial (boolean).
    //
    // Note: after changing vis data, call _afterSetState to re-start
    // layouting.
    //
    _beforeSetState : function () {
        "use strict";

        var initial = this.force === undefined;

        if (initial) {
            this.all_links = [];
            this.links_map = {};
            this.filterRelApplied = false;
            this.all_nodes = [];
            this.nodes_map = {};

            this.has_depth = false;

            this.removed_nodes = {};
        }
        else {
            // Stop the layout so it doesn't try to work on the data
            // while we're modifying it.
            this.force.stop();
            this.force.on("tick", undefined);

            if (this.links_map === undefined) {
                this.links_map = {};
            }
        }

        return initial;
    },

    // Finalize setting state for visualization.
    // Starts layouting and zooms the visualization to fit.
    //
    // "initial" parameter should be a boolean returned from _beforeSetState.
    //
    _afterSetState : function (initial, callback) {
        "use strict";

        if (initial) {
            this._constructLayout();
        }

        this.updateLayout();

        // setLayoutConstraints will fail to compute proper constraints in case
        // nodes don't have indices and those are assigned when the force starts,
        // so we need to make sure that it's running before calling the
        // setLayoutConstraints function.
        this.startLayout(this.options.layout_iterations.initial);

        if (initial) {
            this.updateSVG(initial, callback);
            this.setLayoutConstraints();

            if (this.options.dynamic) {
                this.force.on("tick", bindContext(this, this.tick));
                this.startLayout(this.options.layout_iterations.set_state_dynamic);
                this.force.on("end", bindContext(this, this.layoutEnd));
                d3.select(window).on("resize", bindContext(this, function () {
                    this.resize();
                }));
            }
            else {
                this.startLayout(this.options.layout_iterations.set_state_static);
            }

            this.force.handleDisconnected(false);

            this.tick();
            this.zoomToFitInitial();

            // Model state banner highlighting works not very smooth during
            // visualization layouting, so do _highlightBannerActiveStep() once
            // layout started.
            if (this.options.view_mode) {
                this._highlightBannerActiveStep();
            }
        }
        else {
            var do_zoom = this.options.layout === 1;

            this.setLayoutConstraints();
            
            // Start layout to clear some space for newly added nodes.
            this.startLayout(this.options.layout_iterations.set_state_subsequent);
            this.layoutTransition(do_zoom, bindContext(this, function () {
                this.updateSVG(false, bindContext(this, this.calculateFitZoom));
                // Kick layout once more now that nodes have their accurate
                // size calculated by updateSVG.
                this.startLayout(this.options.layout_iterations.show_labels);
                if (callback !== undefined) {
                    callback();
                }
            }));
        }
    },

    // Process data and add it to the visualization.
    //
    // data - The data to process in the following format:
    //        {
    //            links : [ <link object> ]
    //            nodes : { <id> : <node object> }
    //        }
    //
    //        <link object> : {
    //            id     : Relationship id as a string.
    //            kind   : Kind of relationship (e.g. "HostContainment").
    //            length : Length of relationship (e.g. 1).
    //            src_id : Source node id as a string.
    //            source : Source node (optional).
    //            style  : Style of relationship can be: "arrow" or "peer".
    //            tgt_id : Target node id as a string.
    //            target : target node (optional).
    //        }
    //
    //        <node object> : {
    //            depth      : Depth of node in the graph.
    //            id         : Node id as a string.
    //            kind       : Kind of node (e.g. "MFPart").
    //            name       : Name of node (display name).
    //            root       : Flag if this node is a root node.
    //            short_name : Short name of node which can be
    //                         used as a label in the visualization.
    //        }
    //
    // source   - optional: Source node from where we are expanding the model.
    // callback - optional: callback function to call when finished.
    //
    _handleData : function (data, source, callback) {
        "use strict";

        // Do we have any data? If an error occurred in the backend we
        // might not
        if (data === null) {
            // HERE: The 500 error includes a message but this has been lost?
            this._setMessage("An error has occurred.");
            return;
        }

        // If the data contains rules, replace the existing rules since the new one
        // mentioned in data is the most-recently updated state.
        if (data.rules && data.rules.length > 0 && this.setRulesVizState) {
            this.setRulesVizState(data.rules);
        }

        // prepare for data changes, stop layouting
        // initial - whether it's the first time we load data or not
        var initial = this._beforeSetState();

        if (initial) {
            this._handleDataInitial(data);
        }
        else {
            this._handleDataUpdate(data, source);
        }

        // finalize data changes and restart layouting
        this._afterSetState(initial, callback);

        if (initial && this.pushEvent) {
            this.pushEvent(
                this.EVENT_SET_INITIAL_DATA,
                {"data": data}
            );
        }
    },

    // Handle the initial data, converting the structures from
    // the server into what we require.
    //
    _handleDataInitial : function (data) {
        "use strict";

        var objref = this;

        if (data.layout !== undefined) {
            this.options.layout = data.layout;
            this.prev_layout    = data.layout;
        }

        if (data.impact_direction !== undefined) {
            this.options.impact_direction = data.impact_direction;
        }

        this.all_links = data.links;
        this.hulls     = {};

        if (this.title_span) {
            this._constructTitle();
        }

        Object.keys(data.nodes).forEach(function (id) {
            var node_data = data.nodes[id];

            if (node_data && node_data.removed) {
                // Initially removed node: don't include it in internal
                // structures or in cola layout
                this.removed_nodes[id] = node_data;
                return;
            }

            var n = this.nodes_map[id] = mergeObjects(node_data, {});

            this.all_nodes.push(n);

            if (n.hull) {
                var hulls_array = this.hulls[n.hull];
                if (hulls_array === undefined) {
                    this.hulls[n.hull] = [n];
                }
                else {
                    hulls_array.push(n);
                }
            }

            // Build up collection member lookup

            if (n.members !== undefined) {
                n.members.each(function (item) {
                    objref.collection_members[item] = id;
                });

                if (n.expanded) {
                    n.hidden = true;
                }
            }

            n.id       = id;
            n.width    = this.NODE_SIZE;
            n.height   = this.NODE_SIZE;
            n.y_offset = 0;

            if (n.root && !this.root_kind) {
                this.root_kind = n.kind;
            }

            // Set has_depth for _getAvailableLayouts
            if (!this.has_depth && n.depth !== 0) {
                this.has_depth = true;
            }

            if (n.edge_neighbours) {
                this.max_edge_neighbours =
                    Math.max(this.max_edge_neighbours, n.edge_neighbours);
            }

        }, this);

        this.all_links.forEach(bindContext(this, function(link) {
            link.id     = this._buildLinkId(link.src_id, link.tgt_id);
            link.source = this.nodes_map[link.src_id];
            link.target = this.nodes_map[link.tgt_id];
            this.links_map[link.id] = link;
        }));

        // Safeguard for visualization consistency
        // Hide collection member nodes of non-expanded collections
        // TODO HACK for beta
        this.all_nodes.forEach(function (node) {
            // if a collection member
            if (node.collection && !node.members) {
                var collection = this.nodes_map[node.collection];

                if (collection === undefined) {
                    // data inconsistent - skip the collection
                    console.log("Error: Missing collection", node.collection);
                    return false;
                }

                if (collection.expandable && !collection.expanded && !node.hidden) {
                    node.hidden = true;
                }
            }
        }, this);
    },

    // Update the data with more data from the server.
    //
    _handleDataUpdate : function (data, source) {
        "use strict";

        var has_collections = this.isCollectionNode !== undefined;

        d3.values(data.nodes).forEach(bindContext(this, function(n) {

            var exists = this.nodes_map[n.id] !== undefined;

            if (!n.removed && this.removed_nodes[n.id]) {
                // Initially removed node is being restored - remove from
                // removed_nodes
                delete this.removed_nodes[n.id];

                if (has_collections && this.isCollectionNode(n)) {
                    // check collection members if they are being restored too

                    n.members.forEach(function (member_id) {
                        var removed_node = this.removed_nodes[member_id];

                        if (removed_node && !removed_node.removed) {
                            delete this.removed_nodes[member_id];
                        }
                    }, this);
                }
            }

            if (n.hull) {
                var hulls_array = this.hulls[n.hull];
                if (hulls_array === undefined) {
                    this.hulls[n.hull] = [n];
                }
                else if (hulls_array.indexOf(n) === -1) {
                    hulls_array.push(n);
                }
            }

            // Update collection members lookup

            if (n.members !== undefined) {
                n.members.forEach(function (item) {
                    this.collection_members[item] = n.id;
                }, this);
            }

            if (exists) {
                var en = this.nodes_map[n.id];

                // Resolve counts of suppressed related nodes
                if (en.suppressed) {
                    if (n.suppressed) {
                        if (n.suppressed < en.suppressed) {
                            en.suppressed = n.suppressed;
                        }
                    }
                    else {
                        delete en.suppressed;
                    }
                }
            }
            else {
                if (source === undefined) {
                    // TODO render the node off-screen first and compute
                    // accurate size

                    if (this.showing_labels) {
                        // not accurate, but gives smoother transition
                        // to real size (which usually is not much bigger)
                        n.width    = this.LABELS_NODE_SIZE;
                        n.height   = this.LABELS_NODE_SIZE;
                    }
                    else {
                        n.width    = this.NODE_SIZE;
                        n.height   = this.NODE_SIZE;
                    }

                    n.y_offset = 0;
                }

                this.all_nodes.push(n);
                this.nodes_map[n.id] = n;
            }

            if (source !== undefined) {
                // Base size/position of the node on the source node
                n.x = source.x;
                n.y = source.y;

                if (n.width === undefined) {
                    n.width = source.width;
                }
                if (n.height === undefined) {
                    n.height = source.height;
                }
                if (n.y_offset === undefined) {
                    n.y_offset = source.y_offset;
                }

                if (n.hidden) {
                    // Hidden node being added - move outside bounds
                    this._moveNodeOutsideBounds(n);
                }
            }

            if (n.edge_neighbours) {
                this.max_edge_neighbours =
                    Math.max(this.max_edge_neighbours, n.edge_neighbours);
            }
        }));

        // Only add links that are not already present
        this.all_links.forEach(function(link) {
            if (this.links_map[link.id] === undefined) {
                this.links_map[link.id] = link;
            }
        }, this);

        data.links.forEach(bindContext(this, function(link) {
            link.id = this._buildLinkId(link.src_id, link.tgt_id);
            if (!(link.id in this.links_map)) {
                link.source = this.nodes_map[link.src_id];
                link.target = this.nodes_map[link.tgt_id];
                this.all_links.push(link);
                this.links_map[link.id] = link;
            }
        }));
    },

    // Move the designated node outside the current graph bounds.
    // This effectively prevents invisible nodes from interacting with others.
    //
    // TODO: this is essentially a HACK we must do, because we have no way of
    //       removing nodes from the cola layout library.
    //
    // This modifies the y position of the node. The old one is saved as "old_y"
    // attribute.
    //
    _moveNodeOutsideBounds : function (d) {
        "use strict";

        var bounds     = this._getGraphBounds(),
            viz_height = bounds.Y - bounds.y;

        // Save node position before moving it outside the bounds
        if (d.old_y === undefined) {
            d.old_y = d.y;

            if ((d.y - bounds.y) < (bounds.Y - d.y)) {
                d.y -= viz_height;
            }
            else {
                d.y += viz_height;
            }
        }
    },

    // Apply SVG transformations.
    //
    tick : function () {
        "use strict";

        this.link_sel.attr("d", this.linkPath);

        this._setTransformAttr();

        this._setClipPaths();
        this.clip_sel.attr("d", this.clipPath.bind(this));

        if (this.zoom_countdown) {
            if (--this.zoom_countdown === 0) {
                this.zoomToFit();
                this.zoom_countdown = this.zoom_countdown_2;
                this.zoom_countdown_2 = 0;
            }
        }
    },

    layoutEnd : function() {
        "use strict";

        // If the layout settles before it has been zoomed to fit, do it now.

        if (this.zoom_countdown || this.zoom_countdown_2) {
            this.zoom_countdown   = 0;
            this.zoom_countdown_2 = 0;
            this.zoomToFit();
        }
    },

    changeRouting : function(routing) {
        "use strict";

        d3.select('.routing-direction.vis-sidebar-menu-list-item_selected').classed('vis-sidebar-menu-list-item_selected',false);

        // The code assumes that routing is successful by default.
        var routing_successful = true;

        //autocloser.forceClose();

        if (routing === undefined) { routing = this.routing; }

        switch (routing) {

        case 1:
            // Now only routeEdgesOrthogonally can fail to route edges due to
            // the complexity of the graph, so we redefine routing_successful
            // variable only in case 1.
            routing_successful = this.routeEdgesOrthogonally();
            break;

        case 2:
            if (this.options.layout === 1) {
                this.linkPath = this.linkImpact.bind(this);
            }
            else {
                this.routeEdgesLinearly();
            }
            break;

        default:
            this.routeEdgesDirect();
            break;
        }

        // Set this.routing only if edges have been routed successfully.
        if (routing_successful) { this.routing = routing; }

        this.link_sel.attr("d", this.linkPath);
    },

    clearEdgeRoutes : function() {
        "use strict";

        this.routing  = 0;
        this.linkPath = this.linkArc.bind(this);

        this.all_links.forEach(function(link) {
            delete link.multiline_route;
            delete link.impact_route;
            delete link.orth_route;
        });

        this.link_sel.attr("d", this.linkPath);
    },

    routeEdgesDirect : function() {
        "use strict";
        this.routing = 0;
        this.linkPath = this.linkArc.bind(this);
    },

    // Should return:
    // - true, if edges have been routed successfully,
    // - false or undefined in case routing failed.
    //
    routeEdgesOrthogonally : function() {
        "use strict";

        var force = this.force,
            size  = this.NODE_SIZE;

        force.stop();

        this.node_sel.each(function(d) {
            var h2 = size / 2 + 10,
                w2 = d.node_icon_width / 2 + 10,
                x  = d.x,
                y  = d.y - d.y_offset;

            d.innerBounds = new cola.vpsc.Rectangle(x-w2, x+w2, y-h2, y+h2);
        });

        // Just to confuse us, the GridRouter has its own idea of the
        // node index, within just the nodes it cares about. We store
        // a new index attribute to allow us to track the nodes.

        this.vis_nodes.forEach(function(n, i) {
            n.gr_idx = i;
        });

        var gridrouter = new cola.GridRouter(this.vis_nodes, {
            getChildren: function (v) {
                return v.children;
            },
            getBounds: function (v) {
                return v.innerBounds;
            }
        });

        gridrouter.deadline = new Date().getTime() + 5000;

        var links  = this.vis_links,
            routes;

        try {
            routes = gridrouter.routeEdges(links, 15,
                                           function(l) { return l.source.gr_idx; },
                                           function(l) { return l.target.gr_idx; });
        }
        catch (e) {
            createMessageBoard();

            if (e === "timeout") {
                messageBoardRaise("Sorry, the visualization is too complex for orthogonal routing");
            }
            else {
                console.log("Routing error: " + e);
                messageBoardRaise("Unable to calculate suitable orthogonal routing for this visualization");
            }

            window.setTimeout(function() { messageBoardClose(); }, 5000);
            return;
        }

        routes.forEach(function(route, idx) {
            // Scale the route based on a bounding rectangle between
            // the two nodes.

            var link      = links[idx],
                link_attr = this._findLinkAttributes(link),
                sx        = link_attr.sx,
                sy        = link_attr.sy,
                dx        = (link_attr.tx - sx) || 1,
                dy        = (link_attr.ty - sy) || 1;

            link.orth_route = route.map(function(seg) {
                return [{x: (seg[0].x - sx) / dx,
                         y: (seg[0].y - sy) / dy},
                        {x: (seg[1].x - sx) / dx,
                         y: (seg[1].y - sy) / dy}];
            });
        }, this);

        this.linkPath = this.linkOrtho.bind(this);

        return true;
    },

    routeEdgesLinearly : function() {
        "use strict";

        var force = this.force,
            size  = this.NODE_SIZE;

        // Edge routing uses an innerBounds property on each node to
        // indicate the size of the node icon within the node's
        // bounding box. The edge routing algorithm first constructs a
        // tangent visibility graph in prepareEdgeRouting(), then
        // routes each edge through that graph.

        force.stop();

        this.node_sel.each(function(d) {
            var h2 = size / 2,
                w2 = d.node_icon_width / 2,
                x  = d.x,
                y  = d.y - d.y_offset;

            d.innerBounds = new cola.vpsc.Rectangle(x-w2, x+w2, y-h2, y+h2);
        });

        force.prepareEdgeRouting();

        this.vis_links.forEach(function(link) {
            var points = force.routeEdge(link)
                         .filter(function(v) { return v; });

            if (points.length <= 2) {
                // Straight line -- no route to store
                delete link.multiline_route;
            }
            else {
                // Store route in polar coordinates so it can be
                // transformed appropriately as the nodes move.

                var end    = points.pop(),
                    start  = points.shift(),
                    dx     = end.x - start.x,
                    dy     = end.y - start.y,
                    theta  = Math.atan2(dy, dx),
                    radius = Math.sqrt(dx*dx + dy*dy);

                link.multiline_route = points.map(function(point) {
                    var dx = point.x - start.x,
                        dy = point.y - start.y;

                    return {t: Math.atan2(dy, dx) - theta,
                            r: Math.sqrt(dx*dx + dy*dy) / radius};
                });
            }
        });

        this.linkPath = this.linkMultiLine.bind(this);
    },

    _setTransformAttr : function () {
        "use strict";

        this.hull_sel.attr("d", bindContext(this, this.hullPath));
        this.surround_sel.attr("transform", this.transform);
        this.node_sel.attr("transform", this.transform);

        if (this.showing_labels) {
            this.text_sel.attr("transform", this.transform);
        }

        this.manual_group_indicators_sel.attr("transform", this.transform);
    },

    // Returns a function that counts the nodes in multiple
    // transitions and performs a callback when all transitions
    // have completed for all nodes. Optionally also removes
    // nodes at the ends of their transitions.
    //
    endallMulti : function (emname, callback) {
        "use strict";

        function onTransitionEnd(elem, remove_it, ncb, interrupt_cb) {
            if (ncb !== undefined) {
                ncb(elem);
            }

            if (interrupt_cb !== undefined) {
                interrupt_cb(elem);
            }

            if (remove_it) {
                d3.select(elem).remove();
            }

            if (!--n && callback !== undefined) {
                callback();
                fired = true;
            }
        }

        var n     = 0,
            fired = false,

            // transition   - d3 transition array
            // remove_it    - flag if node will remove at the end of transition
            // ncb          - callback function to call at the end of transition
            // interrupt_cb - callback function to call if transition has been interrupted
            ender = function(transition, remove_it, ncb, interrupt_cb) {
                transition
                    .each(function() { ++n; })
                    .each("end", function () {
                        onTransitionEnd(this, remove_it, ncb);
                    })
                    .each("interrupt", function () {
                        onTransitionEnd(this, remove_it, ncb, interrupt_cb);
                    });
            };

        ender.getCounter = function () {
            return n;
        };

        ender.callbackFired = function () {
            return fired;
        };

        return ender;
    },

    // Perform layout transition
    //
    layoutTransition : function (do_zoom, callback) {
        "use strict";

        if (do_zoom)
            this.zoomToFitTransition(this.LAYOUT_TRANSITION);
        
        var ender = this.endallMulti("layoutTransition",
                                     bindContext(this, function() {

            this.force.handleDisconnected(false);
            this.force.on("tick", bindContext(this, this.tick));

            this.tick();
            if (callback !== undefined) {
                callback();
            }
        })),
            ender2;

        // If we are changing to or from the impact layout, add a
        // second-phase transition to complete the change to the links.
        if (this.options.layout === 1 && this.prev_layout !== 1) {
            // Changing to impact layout

            ender2 = ender;
            ender  = this.endallMulti("layoutTransition2",
                                      bindContext(this, function() {
                this.link_sel
                    .attr("d", this.linkImpactFlat.bind(this));
                
                this.link_sel.transition().duration(this.LINE_TRANSITION)
                    .attr("d", this.linkPath)
                    .call(ender2);
            }));

            this.link_sel.transition().duration(this.LAYOUT_TRANSITION)
                .attr("d", this.linkArcFlat.bind(this))
                .call(ender);
        }
        else if (this.options.layout !== 1 && this.prev_layout === 1) {
            // Changing from impact layout

            ender2 = ender;
            ender  = this.endallMulti("layoutTransition2",
                                      bindContext(this, function() {
                this.link_sel
                    .attr("d", this.linkArcFlat.bind(this));
                
                this.link_sel.transition().duration(this.LINE_TRANSITION)
                    .attr("d", this.linkPath)
                    .call(ender2);
            }));

            this.link_sel.transition().duration(this.LAYOUT_TRANSITION)
                .attr("d", this.linkImpactFlat.bind(this))
                .call(ender);
        }
        else {
            this.link_sel.transition().duration(this.LAYOUT_TRANSITION)
                .attr("d", this.linkPath)
                .call(ender);
        }

        if (this.showing_labels) {
            this.text_sel.transition().duration(this.LAYOUT_TRANSITION)
                .attr("transform", this.transform)
                .call(ender);
        }

        if (this.options.show_manual_groups !== "none") {
            this.manual_group_indicators_sel.transition().duration(this.LAYOUT_TRANSITION)
                .attr("transform", this.transform)
                .call(ender);
        }

        this.hull_sel.transition().duration(this.LAYOUT_TRANSITION)
            .attr("d", bindContext(this, this.hullPath))
            .call(ender);

        this.surround_sel.transition().duration(this.LAYOUT_TRANSITION)
            .attr("transform", this.transform)
            .call(ender);
        
        this.node_sel.transition().duration(this.LAYOUT_TRANSITION)
            .attr("transform", this.transform)
            .call(ender);

        this._setClipPaths();
        this.clip_sel.transition().duration(this.LAYOUT_TRANSITION)
            .attr("d", this.clipPath.bind(this))
            .call(ender);
        
        return ender;
    },

    // Handle object transformation.
    // This function does not have the object scope.
    //
    transform : function (d) {
        "use strict";

        if (d.x !== undefined && d.y !== undefined) {
            return "translate(" + d.x + "," + (d.y - d.y_offset) + ")";
        }
        else {
            return "";
        }
    },

    // Construct hull path
    //
    hullPath : function(hull_id) {
        "use strict";

        var coords = [];

        this.hulls[hull_id].forEach(function (n) {
            if (n.visible) {
                // Add the four corners of the node's bounding box,
                // with a little padding.
                var x = n.x,
                    y = n.y,
                    w = n.width / 2  + 10,
                    h = n.height / 2 + 10;

                coords.push([x-w, y-h], [x-w, y+h], [x+w, y+w], [x+w, y-w]);
            }
        });

        if (coords.length === 0) {
            return "";
        }

        return this.hull_line(d3.geom.hull(coords));
    },

    // Return array of nodes from vis_nodes that have color_info for
    // the current surround_type
    //
    _nodesWithSurrounds : function() {
        "use strict";

        var surround_type  = this.options.surround_type,
            surround_nodes = [];

        if (surround_type === "user_saved") {
            // Special-case for user-saved nodes in application models
            this.vis_nodes.forEach(function(node) {
                if (node.user_saved !== undefined)
                    surround_nodes.push(node);
            });
        }
        else if (surround_type) {
            this.vis_nodes.forEach(function(node) {
                if (node.color_info && node.color_info[surround_type])
                    surround_nodes.push(node);
            });
        }
        return surround_nodes;
    },
    
    // Set node surround clipping data
    //
    _setClipPaths : function() {
        "use strict";

        var clip_nodes = this._nodesWithSurrounds(),
            clips      = this.voronoi(clip_nodes),
            clip_paths = {};

        for (var idx=0; idx < clips.length; ++idx) {
            var n = clip_nodes[idx],
                x = n.x,
                y = n.y - n.y_offset,
                v = clips[idx],
                c = [];

            if (v) {
                for (var vi=0; vi < v.length; ++vi)
                    c.push([v[vi][0] - x, v[vi][1] - y]);
            }
            clip_paths[n.id] = c;
            this.all_clip_paths[n.id] = c;
        }

        this.clip_paths = clip_paths;
    },

    // Construct clip path from voronoi data
    //
    clipPath : function(n_id) {
        "use strict";

        // When nodes are removed from view, their entries are removed
        // from this.clip_paths at a time the paths are still visible
        // and fading out, so we use all_clip_paths to access the
        // previous paths.
        
        var c = this.clip_paths[n_id] || this.all_clip_paths[n_id];
        return c ? this.voronoi_line(c) : "";
    },

    // Redraw the visualization.
    //
    redraw : function (duration, skip_slider) {
        "use strict";

        if (this.zoom_slider && !skip_slider) {
            this.setZoomSliderValue();
        }

        (duration ?
         this.container.transition().duration(duration) : this.container)
            .attr("transform", "translate(" + this.zoom.translate() +
                  ") scale(" + this.zoom.scale() + ")");
    },

    // Calculate the bounds of a selection.
    //
    // s - optional: Selection of nodes to calculate
    //     the bounds. The current graph is used
    //     if it is undefined.
    //
    _getGraphBounds : function (s) {
        "use strict";

        var x = Number.POSITIVE_INFINITY,
            X = Number.NEGATIVE_INFINITY,
            y = Number.POSITIVE_INFINITY,
            Y = Number.NEGATIVE_INFINITY,
            border = this.showing_labels ? 20 : 8;

        s = s === undefined  ? this.nodes_group.selectAll("g")
                             : s;

        s.each(function (d) {
            if (d.old_y || !d.bounds) {
                // node is outside the bounds or does not have them - continue
                return;
            }

            x = Math.min(x, d.bounds.x);
            X = Math.max(X, d.bounds.X);
            y = Math.min(y, d.bounds.y - d.y_offset);
            Y = Math.max(Y, d.bounds.Y - d.y_offset);
        });

        // Number.POSITIVE_INFINITY + 5 === Number.POSITIVE_INFINITY
        // Math.abs(Number.NEGATIVE_INFINITY) === Number.POSITIVE_INFINITY
        // Math.min(Number.POSITIVE_INFINITY, undefined) === NaN
        var invalid = [x, X, y, Y].some(function (val) {
            return (Math.abs(val) === Number.POSITIVE_INFINITY) || isNaN(val);
        });

        return {
            x     : x - border,
            X     : X + border,
            y     : y - border,
            Y     : Y + border,

            // valid if all of the bounds are not infinite and not NaN
            valid : !invalid
        };
    },

    // Return selection width, height and whether its bounds are valid.
    //
    _getSelectionSize : function (bounds) {
        "use strict";

        var b  = typeof bounds === "object" ? bounds
                : this._getGraphBounds();

        return {
            width  : b.X - b.x,
            height : b.Y - b.y,
            valid  : b.valid
        };
    },

    // Check whether the whole visualization is currently visible (zoomed to fit
    // its window).
    //
    // strict - flag to indicate if a strict check should be performed.
    //
    isZoomedToFit: function(strict) {
        "use strict";

        // Allow small deviation of scale and translate values for a non-strict
        // check.
        var rel_d     = 0.02,
            abs_d     = 50,
            b         = this._getGraphBounds(),
            sel       = this._getSelectionSize(b),
            s         = this._getFitZoom(sel),
            t         = this.calculateFitZoomTranslate(b, sel, s),
            scale     = this.zoom.scale(),
            translate = this.zoom.translate();

        if (strict) {
            return (scale === s && translate[0] === t[0] && translate[1] === t[1]);
        }
        else {
            // Can't use a relative comparison for translate as it may contain
            // zero values.
            return (Math.abs(scale/s - 1) < rel_d &&
                Math.abs(translate[0] - t[0]) < abs_d &&
                Math.abs(translate[1] - t[1]) < abs_d);
        }
    },

    // Zoom in or out to fit given bounds in the visualization window.
    //
    // duration - Transition duration
    //
    zoomToFitTransition : function (duration) {
        "use strict";

        var b   = this._getGraphBounds(),
            sel = this._getSelectionSize(b);

        var s = this.calculateFitZoom(sel),
            t = this.calculateFitZoomTranslate(b, sel, s);

        // fit zoom defaults to 1.0 if bounds are invalid
        this.zoom.scale(s);

        if (b.valid) {
            this.zoom.translate(t);
        }
        else if (typeof(initial) != 'undefined') {
            // Need non-zero translate values for proper initial zoom and pan.
            //
            // If we are applying initial zoom to fit and the bounds are not
            // valid, this probably means that there are no nodes at all.
            //
            // If we don't set this, the first nodes rendered in an empty
            // visualization could be invisible.
            this.zoom.translate([0.01, 0.01]);
        }

        this.redraw(this.options.dynamic ? duration : 0);
    },

    // Zoom in or out to fit given bounds in the visualization window.
    //
    zoomToFit : function() {
        "use strict";

        this.zoomToFitTransition(this.ZOOM_TRANSITION);
    },
    
    // Zoom in or out to fit given bounds in the visualization window,
    // when producing the initial layout.
    //
    zoomToFitInitial : function() {
        "use strict";

        if (this.options.layout === 0) {
            var b   = this._getGraphBounds(),
                sel = this._getSelectionSize(b);

            // When first drawing a force-directed layout, make sure
            // the image aspect matches the SVG container's aspect
            // (normally wider than tall). transpose() calls
            // zoomToFit(), so we return after transpose().
            if ((this.svg_width >= this.svg_height && sel.height > sel.width) ||
                (this.svg_width <  this.svg_height && sel.width > sel.height)) {

                this.transpose();
                return;
            }
        }
        this.zoomToFit();
    },
    
    // Calculate a zoom scale value to fit the given selection bounds,
    // then adjust the zoom parameters and the zoom slider to accommodate.
    //
    calculateFitZoom : function (s) {
        "use strict";

        var fit_zoom = this._getFitZoom(s);
        this._handleFitZoomChange(fit_zoom);

        return fit_zoom;
    },

    // Calculate translate x and y to position a given selection in bounds center with given scale
    //
    calculateFitZoomTranslate: function(bounds, selection, scale) {
        "use strict";

        var tx = (-bounds.x * scale + (this.svg_width / scale - selection.width) * scale / 2),
            ty = (-bounds.y * scale + (this.svg_height / scale - selection.height) * scale / 2);

        return [tx, ty];
    },

    // Get the zoom scale to fit the given bounds in the visualization window.
    // This does not cause any side effects. The bounds default to the size
    // of current node selection.
    //
    // If the bounds are invalid (e.g. for an empty visualization) the scale
    // defaults to 1.0.
    //
    _getFitZoom : function (s) {
        "use strict";

        var sel_size = s || this._getSelectionSize(),
            fit_zoom = Math.min(this.svg_width / sel_size.width,
                                this.svg_height / sel_size.height, 1.5) * 0.95;

        if (!sel_size.valid) {
            // invalid selection size, probably empty visualization
            fit_zoom = 1.0;
        }

        return fit_zoom;
    },

    _handleFitZoomChange : function (fit_zoom) {
        "use strict";

        // Init zoom slider only for big visualizations where the zoom slider
        // container div is defined
        if (!this.zoom_slider && this.zoom_slider_div && this.options.show_big) {
            this._initZoomSlider(fit_zoom);
        }

        if (this.fit_zoom !== fit_zoom) {
            this.fit_zoom = fit_zoom;
            this.zoom.scaleExtent([fit_zoom * 0.8, 2.5]);

            // Update the zoom slider if we have one
            if (this.zoom_slider) {
                this.updateZoomSlider(fit_zoom);
            }
        }
    },

    // Increase the zoom in the visualization.
    //
    zoomIn : function () {
        "use strict";

        var scale = this.zoom.scale(),
            new_scale = scale * 1.2,
            max_scale = this.zoom.scaleExtent()[1];

        if (scale === max_scale) {
            return;
        }
        else if( new_scale > max_scale) {
            new_scale = max_scale;
        }

        this.changeZoom(new_scale, true);
    },

    // Decrease the zoom in the visualization.
    //
    zoomOut : function () {
        "use strict";

        var scale = this.zoom.scale(),
            new_scale = scale / 1.2,
            min_scale = this.zoom.scaleExtent()[0];

        if (scale === min_scale) {
            return;
        }
        else if( new_scale < min_scale) {
            new_scale = min_scale;
        }

        this.changeZoom(new_scale, true);
    },

    changeZoom : function (new_scale, transition) {
        "use strict";

        var s = this.zoom.scale(),
            t = this.zoom.translate(),
            z = this.zoom.size(),
            c = [z[0] / 2, z[1] / 2];

        this.zoom
            .translate([c[0] + (t[0] - c[0]) / s * new_scale,
                        c[1] + (t[1] - c[1]) / s * new_scale])
            .scale(new_scale);

        this.redraw(transition ? this.ZOOM_TRANSITION : 0);
    },

    // Function that updates the values of visualization bounds to reflect window resize
    // or other  changes in visualization size(like setSmall, setBig, fullScreen)

    // "allow_zoom_in" and "allow_zoom_out" control whether zoomToFit will be
    // called. If a zoom in / out is disallowed, zoomToFit won't be called if
    // it would zoom in or out, respectively.

    // svg_rect - object {width:, height:} - object that represents a new visualization size

    _updateVizBounds: function (allow_zoom_in, allow_zoom_out, svg_rect) {
        "use strict";

        // resize event may be fired before this.force is created.
        // Make sure that this.force and this.zoom exist before
        // calling isZoomedToFit to prevent errors.
        // is_zoomed_to_fit flag should be set before _updateSVGBounds
        // function call, otherwise it may receive an incorrect value.
        var is_zoomed_to_fit = this.force && this.zoom && this.isZoomedToFit(false);

        // provided precaculated width and height to _updateSVGBounds
        this._updateSVGBounds(svg_rect);

        if (this.force && this.zoom) {
            var old_size = this.zoom.size(),
                t        = this.zoom.translate(),
                x_delta  = (this.svg_width - old_size[0])/2,
                y_delta  = (this.svg_height - old_size[1])/2;

            this.force.size([this.svg_width, this.svg_height]).resume();
            this.zoom.size([this.svg_width, this.svg_height]);

            if (!allow_zoom_in && !allow_zoom_out) {
                // no zoom allowed
                return;
            }

            if (!allow_zoom_in && this._getFitZoom() > this.zoom.scale()) {
                // don't zoom in: the fit zoom would be greater than
                // current scale
                return;
            }

            if (!allow_zoom_out && this._getFitZoom() < this.zoom.scale()) {
                // don't zoom out: the fit zoom would be smaller than
                // current scale
                return;
            }

            // If the whole visualization is currently visible,
            // then zoom it to fit the new size...
            if (is_zoomed_to_fit) {
                this.zoomToFit();
            }
            // ...otherwise keep the scale and adjust its position.
            else {
                this.zoom.translate([t[0] + x_delta, t[1] + y_delta]);
                this.redraw(this.ZOOM_TRANSITION);
            }
        }
    },

    // Resize the visualization window. Also performs a "_updateVizBounds" operation.
    //
    // allow_zoom_in and allow_zoom_out are bypassed to "_updateVizBounds"
    //
    // By default, both zoom types are allowed.
    //
    resize : function (allow_zoom_in, allow_zoom_out) {
        "use strict";

        allow_zoom_in  = allow_zoom_in  === undefined ? true : allow_zoom_in;
        allow_zoom_out = allow_zoom_out === undefined ? true : allow_zoom_out;

        // We apply height first, in order to scrollbar be visible, it affects width

        if (this.enabled) {
            var inline_vis_height = (window.innerHeight - 21),// Math.floor(window.innerHeight * this.h_scale),
                inline_vis_width  = Math.floor(window.innerWidth * this.w_scale),
                vis_header        = document.getElementById("InlineVisualizationHeader"),
                //Visualization may miss header(StaticVis), need this check to avoid error
                vis_header_height  = vis_header ? vis_header.clientHeight : 0,
                svg_rect          = {
                    width : this.in_div.node().clientWidth,
                    height: inline_vis_height - vis_header_height
                };

            // This step is a problematic one. After we apply style property to element its
            // clientHeight property is changing asynchronously. As a result in updateVizBounds
            // we tried to change viz bounds to one, that were not updated yet.
            this.in_div.style("height", inline_vis_height + "px");

            if (!this.options.show_big) {
                this.in_div.style("width", inline_vis_width + "px");
                svg_rect.width = inline_vis_width;
            }

            // To solve a problem, we provide a height and width properties
            this._updateVizBounds(allow_zoom_in, allow_zoom_out, svg_rect);
        }
    },

    // svg_rect - optional: Object which holds current svg width and height
    //
    _updateSVGBounds: function (svg_rect) {
        "use strict";

        svg_rect = svg_rect || this.svg.node().getBoundingClientRect();

        // Reduce the width to accommodate the sidebar
        this.svg_width  = svg_rect.width - 110 * this.w_scale;
        this.svg_height = svg_rect.height;
    },

    // Toggle the window size of the visualization.
    //
    toggleSize : function () {
        "use strict";

        if (this.options.show_big) {
            this.options.show_big = false;
            this.hideLabels();
            this.setSmall();
        }
        else {
            this.options.show_big = true;
            this.setBig();
            if (this.options.show_labels) {
                this.showLabels();
            }
        }

        this.saveVizOptions();
        this._constructTitle();
        this.resize();
    },
	
    // Ensure the visualization window is shown as a large window.
    //
    setBig : function () {
        "use strict";

        /*this.expand_btn
            .attr("src", this.options.images.less_normal)
            .attr("onmouseout", "this.src='" + this.options.images.less_normal + "';")
            .attr("onmouseover", "this.src='" + this.options.images.less_hot + "';");*/

        if (this.draggable) {
            this.draggable.destroy();
            this.draggable = undefined;
        }

        this.w_scale = this.BIG_W_SCALE;
        this.h_scale = this.BIG_H_SCALE;

        this.in_div
            .attr("class", this.BIG_DIV_CLASS)
            .attr("style", "");

        this.ctrl_div.attr("style", "");

        this.zoom_slider_div.attr("style", "");

        if (this.save_changes_button) {
            this.updateSaveChangesButton();
        }

        if (this.svg) {
            this.svg.on("contextmenu", bindContext(this, this.showContextMenu));
        }

        if (this.surround_sel) {
            this.surround_sel
                .transition().duration(this.FADE_TRANSITION)
                .attr("r", this.BIG_SURROUND_SIZE);
        }
    },

    // Ensure the visualization window is shown as a small window.
    //
    setSmall : function () {
        "use strict";

        this.expand_btn
            .attr("src", this.options.images.more_normal)
            .attr("onmouseout", "this.src='" + this.options.images.more_normal + "';")
            .attr("onmouseover", "this.src='" + this.options.images.more_hot + "';");

        this.w_scale = this.SMALL_W_SCALE;
        this.h_scale = this.SMALL_H_SCALE;

        this.in_div
            .attr("class", this.SMALL_DIV_CLASS)
            .style(this._inDivStyle());

        this.ctrl_div.attr("style", "display:none");

        this.zoom_slider_div.attr("style", "display:none");

        if (this.save_changes_button) {
            this.save_changes_button.style({ display: "none" });
        }


        this.draggable = new Draggable(this.inner_id || "InlineVisualizationInner", {
            handle : this.header_id || "InlineVisualizationHeader",
            onEnd  : bindContext(this, this._vizDragEnd)
        });

        if (this.svg) {
            this.svg.on("contextmenu", undefined);
            this.closeKey();
            this.dragMode();
        }

        if (this.surround_sel) {
            this.surround_sel
                .transition().duration(this.FADE_TRANSITION)
                .attr("r", this.options.layout === 1 ? this.BIG_SURROUND_SIZE : this.SMALL_SURROUND_SIZE);
        }
    },

    // Calculate style for the in_div element.
    //
    _inDivStyle : function () {
        "use strict";

        if (this.options.show_big) {
            return {};
        }

        var pos = this._choosePosition();

        this.options.small_x = pos.x;
        this.options.small_y = pos.y;

        return {
            "z-index": 90,
            "top": this.options.small_y + "px",
            "left": this.options.small_x + "px"
        };
    },

    // Choose the position of the small visualization window.
    //
    _choosePosition : function () {
        "use strict";

        var x = this.options.small_x,
            y = this.options.small_y,
            page_header = $("pageHeader"),
            offsetTop   = page_header ? page_header.offsetHeight : 0;

        if (x === -1 && y === -1) {
            // Initial placement

            x = window.innerWidth * (1 - this.w_scale) - 40;
            y = window.innerHeight * this.h_scale;
        }
        else {
            // Existing placement. Make sure it's at least partially
            // visible in the window.

            if (x > window.innerWidth - 50) {
                x = window.innerWidth * (1 - this.w_scale) - 40;
            }

            if (y > window.innerHeight - 36) {
                y = window.innerHeight * (1 - this.h_scale) - 15;
            }

            if (x + window.innerWidth * this.w_scale < 75) {
                x = 10;
            }

            // When the small visualization is dragged under .pageHeader it
            // becomes unreachable since .pageHeader has fixed position on the
            // page. So we need exclude its height from the reachable viewport.
            if (y < offsetTop) {
                y = offsetTop + 10;
            }
        }

        return {
            x : x,
            y : y
        };
    },

    // Action handler when the dragging of the draggable ends.
    //
    _vizDragEnd : function() {
        "use strict";

        var style = this.in_div.attr("style"),
            left  = /left:\s*(-?\d+)px;/.exec(style),
            top   = /top:\s*(-?\d+)px;/.exec(style);

        if (left && top) {
            this.options.small_x = parseInt(left[1]);
            this.options.small_y = parseInt(top[1]);

            this.saveVizOptions();

            // Check it's in an acceptable position
            var pos = this._choosePosition();
            if (pos.x != this.options.small_x || pos.y != this.options.small_y) {
                this.in_div.style(this._inDivStyle());
            }
        }
    },

    // Handle a node click.
    //
    nodeClick : function (d, node) {
        "use strict";

        // Navigate to node just if mouse in the drag mode and the node picker mode is off.
        if (this.mouse_mode === 0 && !this.node_picker_mode && this.options.nodes_clickable) {
            // Open in a new tab in case of control-click.
            this.navigateToNode(d, d3.event.ctrlKey);
        }
    },

    // Handle a node mouse down event.
    //
    nodeMouseDown : function (d, node) {
        "use strict";
    },

    // Handle a node mouse up event.
    //
    nodeMouseUp : function (d, node) {
        "use strict";
    },

    // Enable drag mode (default mode).
    //
    dragMode : function () {
        "use strict";

        this.mouse_mode = 0;

        d3.select("body").on("keydown.dragMode", undefined);

        if (this.zoom) {
            this.svg
                .call(this.zoom)
                .on("dblclick.zoom", null);
        }

        this.back_rect.on("dblclick.zoom", bindContext(this, this.zoomToFit));
        this.back_rect.on(".drag", undefined);
        this.back_rect.style("cursor", "move");

        if (this.link_sel){
            this.link_sel.on(".drag", undefined);
            this.link_sel.on("dblclick.zoom", bindContext(this, this.zoomToFit));
            this.link_sel.style("cursor", "pointer");
        }

        if (this.node_sel) {
            this.node_sel.selectAll("*").style("cursor", "pointer");
        }

        return false;
    },


    //
    // Labels

    // Build node labels. To build the labels with word
    // wrapping, we render invisible, then make them
    // visible once wrapped.
    //
    // - force_rebuild - if true, remove labels from DOM and rebuild them,
    //                   useful if changing node names dynamically.
    //
    buildLabels : function (fade_in, ender, force_rebuild) {
        "use strict";

        var objref          = this,
            fade_transition = this.FADE_TRANSITION,
            text_dat        = this.text_group.selectAll("text");

        this.text_group.attr("display", "initial");

        if (force_rebuild) {
            text_dat.remove();

            // re-select after removal
            text_dat = this.text_group.selectAll("text");
        }

        text_dat = text_dat.data(this.vis_nodes, function(n) { return n.id; });

        var text_add = text_dat
            .enter()
            .append("text")
            .attr("x", 0)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("class", function(d) { return d.members ? "vizlabelgroup"
                                                          : "vizlabel"; })
            .attr("transform", this.transform)
            .style("opacity", 0)
            .text(function(d) { return d.short_name; });

        text_add
            .each(function() {
                if (this.getComputedTextLength() > objref.LABEL_TEXT_LENGTH) {
                    var label = d3.select(this);
                    objref.wrapText(label, objref.LABEL_TEXT_LENGTH);
                }
            });

        if (fade_in) {
            text_add
                .transition().duration(fade_transition)
                .call(ender, false, undefined, function (el) {
                    d3.select(el).style("opacity", 1);
                })
                .style("opacity", 1);
        }
        else {
            text_add
                .style("opacity", 1);
        }

        text_dat
            .exit()
            .transition().duration(fade_transition).style("opacity", 0)
            .call(ender, true);

        // Set node sizes according to labels
        this.text_sel = this.text_group.selectAll("text");
        this.text_sel
            .each(function(d) {
                if (!d.fake) {
                    var bb = this.getBBox(),
                        width  = (bb.width > d.node_icon_width) ? bb.width : d.node_icon_width,
                        height = bb.height;

                    // Prevent constraint boxes becoming too long
                    // and thin, because that causes them to stack
                    // vertically, and results in a very tall
                    // layout.
                    d.real_height = (height+20) * 1.1;

                    if (width > height * 1.5) {
                        height = width / 1.2;
                    }

                    d.width = width * 1.15;
                    d.height = (height + 20) * 1.1;
                    d.y_offset = (height + 10) / 4;

                    d.padded_height = d.height;
                }
                else {
                    d.width = 1;
                    d.height = 1;
                    d.y_offset = 0;
                }
            });

        // Expand the links so the labels fit
        this.force.linkDistance(bindContext(this, function(link) {
            return this.LABELS_LENGTH * link.length;
        }));
    },

    // Hide all node labels.
    //
    hideLabels : function () {
        "use strict";

        if (this.showing_labels) {
            this.showing_labels = false;
            this.text_group.attr("display", "none");

            var size = this.options.layout === 0 ? (this.NODE_SIZE + 20) : this.HIERARCHICAL_SIZE;
            this.text_group.selectAll("text")
                .each(function(d) {
                    var icon_width = d.node_icon_width + 20;
                    d.width = (size > icon_width) ? size : icon_width;
                    d.height = size;
                    d.y_offset = 0;
                });

            this.force.linkDistance(bindContext(this, function(link) {
                return this.NO_LABELS_LENGTH * link.length;
            }));
            this.startLayout(this.options.layout_iterations.hide_labels);
            this.zoom_countdown = 20;
        }
    },

    // Show all node labels.
    //
    showLabels : function () {
        "use strict";

        // Check if this.force is in place to prevent function call
        // before initial data is loaded
        if (this.options.show_big && !this.showing_labels && this.force) {
            this.buildLabels(false, function() {});

            this.showing_labels = true;

            this.startLayout(this.options.layout_iterations.show_labels);
            this.zoom_countdown = 2;
            this.zoom_countdown_2 = 20;
        }
    },

    // Toggle showing node labels.
    //
    toggleLabels : function () {
        "use strict";

        autocloser.forceClose();

        if (this.options.show_labels) {
            this.options.show_labels = false;
            this.hideLabels();
        }
        else {
            this.options.show_labels = true;
            this.showLabels();
        }

        this.saveVizOptions();
        this.redraw(this.ZOOM_TRANSITION);
    },

    // Toggle showing node labels.
    // group_display_vis - [string] type of how to display manual groups
    // ex: (none, indicator, label)
    //

    toggleManualGroupLabels : function (group_display_vis) {
        "use strict";
        var manual_group_key_button = this.ctrl_div.select(".ControlDivManualGroupKey");

        autocloser.forceClose();

        if (this.options.show_manual_groups === group_display_vis) {
            return;
        }

        this.options.show_manual_groups = group_display_vis;

        if (group_display_vis === "none") {
            this.manual_group_indicators_group.style({display: "none"});
            manual_group_key_button.style({display: "none"});
        }
        else {
            // this.manual_group_indicators_sel will be empty only in case when
            // manual groups have not ever been constructed
            //
            if (this.manual_group_indicators_sel.data().length) {
                this.manual_group_indicators_group.style({display: "inline"});
                manual_group_key_button.style({display: "inline"});
                this.manual_group_indicators_sel.selectAll("*").remove();
                this._buildManualGroups(this.manual_group_indicators_sel);
            }
            else {
                this.updateSVG(false, undefined);
            }
        }
        
        tw.xhr_client.jsonPostForm("/ui/BasketDetails",{
            action: "set_group_display_vis",
            group_display_vis: group_display_vis,
            reqhash: this.options.nonce_token
        });
    },

    _buildManualGroups: function (manual_groups_sel) {
        "use strict";

        var constructManualGroupsFunction = bindContext(this, this.options.show_manual_groups === "label" ?
              this._constructManualGroupLabels : this._constructManualGroupIndicators);


        manual_groups_sel.each(function (d) {
            if (!d.manual_groups && !d.model_defs) {
                return;
            }

            var g = d3.select(this);

            if (d.manual_groups.length || d.model_defs.length) {
                constructManualGroupsFunction(g, d);
            }
        });
    },

    // Set the node surround
    // 
    setSurroundType : function(surround_type) {
        "use strict";

        autocloser.forceClose();

        if (this.options.surround_type === surround_type)
            return;

        if (this.options.surround_type) {
            // We first set the surround_type to null to clear the current
            // surround, then set it to the required new type in the callback.
            
            this.options.surround_type = null;
            this.updateSVG(false, bindContext(this, function() {
                if (surround_type) {
                    this.options.surround_type = surround_type;
                    this.updateSVG(false, undefined);
                }
                // Save the options only after we have set them to the desired
                // value, rather than the temporary null.
                this.saveVizOptions();
            }));
        }
        else {
            this.options.surround_type = surround_type;
            this.updateSVG(false, undefined);
            this.saveVizOptions();
        }            
    },

    // Transpose the node layout.
    //
    transpose : function (transition) {
        "use strict";

        //this.force.stop();

        if (transition) {
            this.force.on("tick", undefined);
        }

        // Rotate around the centre of the nodes
        var nodes = this.vis_nodes,
            cx = nodes.reduce(function(a, n) { return a + n.x; }, 0) / nodes.length,
            cy = nodes.reduce(function(a, n) { return a + n.y; }, 0) / nodes.length;

        this.all_nodes.forEach(function(n) {
            var t = n.y;
            n.y = cy + n.x - cx;
            n.x = cx - t + cy;
        });

        // Apply single iteration of layout to avoid overlapping of nodes
        // after transposing
        this.startLayout(this.options.layout_iterations.transpose);

        if (transition) {
            this.layoutTransition(true);
        }
        else {
            this.zoomToFit();
            this.tick();
        }
    },

    //
    // Layouts

    // Apply layout constrains
    //
    setLayoutConstraints : function () {
        "use strict";

        var constraints,
            objref   = this,
            layout   = this.options.layout,
            cola_idx = {};

        this.force.nodes().forEach(function (n, idx) {
            // gather node indices for cola layout (it's how it identifies nodes
            // for constraints)
            cola_idx[n.id] = idx;
        });

        this.vis_nodes.forEach(function(n) {
            if (n.padded_height !== undefined) {
                n.height = n.padded_height;
            }
        });

        if (layout === 1) {

            // Use dagre to construct a reasonable impact layout.
            // Annoyingly, dagre can only properly render
            // fully-connected graphs, so we use cola to find the
            // separate sub-graphs, and use dagre on each of them
            // individually.

            var impact_direction = this.options.impact_direction,
                swapped = impact_direction === "LR" || impact_direction === "RL";
            
            constraints = [];

            var subgraphs = cola.separateGraphs(this.vis_nodes, this.vis_links),
                y_shift   = 0;

            subgraphs.forEach(function(subgraph, idx) {

                var nodes    = subgraph.array,
                    node_map = {},
                    link_map = {};

                if (nodes.length < 2) {
                    // Single node, or no data at all -- no point
                    // constructing a layout!
                    return;
                }

                var g = new dagre.graphlib.Graph();
                g.setGraph({});
                g.setDefaultEdgeLabel(function() { return {}; });

                nodes.forEach(function(n) {
                    node_map[n.id] = n;

                    g.setNode(n.id, n);

                    if (n.real_height !== undefined) {
                        n.height = n.real_height;
                    }
                });

                objref.vis_links.forEach(function(link) {
                    if (link.fake) {
                        // Skip fake links (holding hulls)
                        return;
                    }
                    if (!(link.source.id in node_map)) {
                        // Link belongs in another subgraph
                        return;
                    }

                    var k = objref._buildLinkId(link.src_id, link.tgt_id);

                    if (link_map[k] === undefined) {
                        g.setEdge(link.src_id, link.tgt_id);
                        link_map[k] = link;
                    }
                });

                
                // Arrange according to chosen direction
                g.graph().rankdir = impact_direction;
                g.graph().ranksep = swapped ? 100 : 180;
                dagre.layout(g);


                //
                // Build cola constraints based on the Dagre node positions

                var levels      = {},
                    horiz_order = [],
                    xvar        = swapped ? "y" : "x",
                    yvar        = swapped ? "x" : "y";

                // The nodes are put in fixed levels. Convert the levels
                // into alignment and separation constraints.

                nodes.forEach(function(n) {
                    var l = levels[n[yvar]];
                    if (l === undefined) {
                        l = levels[n[yvar]] = [];
                    }
                    l.push(n);
                    horiz_order.push(n);
                });

                var level_keys = Object.keys(levels);
                level_keys.sort(function(a, b) { return a-b; });

                var prev_node;

                level_keys.forEach(function(level) {
                    var nodes   = levels[level],
                        offsets = [];

                    if (nodes.length > 1) {
                        nodes.forEach(function(n) {
                            offsets.push({"node": cola_idx[n.id], "offset":0});
                        });
                        constraints.push({
                            "type"    : "alignment",
                            "axis"    : yvar,
                            "offsets" : offsets});
                    }

                    if (prev_node !== undefined) {
                        constraints.push({
                            "axis"  : yvar,
                            "left"  : cola_idx[prev_node.id],
                            "right" : cola_idx[nodes[0].id],
                            "gap"   : (nodes[0][yvar] - prev_node[yvar]) / 1.2
                        });
                    }
                    prev_node = nodes[0];
                });

                // Convert the horizontal positions into separation
                // constraints.
                prev_node = undefined;
                horiz_order.sort(function(a, b) { return a[xvar] - b[xvar]; });

                horiz_order.forEach(function(node) {

                    if (prev_node !== undefined) {
                        constraints.push({
                            "axis"  : xvar,
                            "left"  : cola_idx[prev_node.id],
                            "right" : cola_idx[node.id],
                            "gap"   : (node[xvar] - prev_node[xvar]) / 1.2
                        });
                    }
                    prev_node = node;
                });


                //
                // Map the edges from Dagre back to the links

                g.edges().forEach(function(edge, idx) {
                    var points  = g.edge(edge).points,
                        link_id = objref._buildLinkId(edge.v, edge.w),
                        link    = link_map[link_id];

                    if (points.length <= 2) {
                        // Straight line -- no route to store
                        delete link.impact_route;
                    }
                    else {
                        // Store route in polar coordinates so it can be
                        // transformed sensibly when the nodes move.
                        var link_attr = objref._findLinkAttributes(link);

                        if (link_attr === undefined) {
                            console.log("Error: undefined link attributes", link);
                            return;
                        }

                        var
                            sx     = link_attr.sx,
                            sy     = link_attr.sy,
                            dx     = link_attr.tx - sx,
                            dy     = link_attr.ty - sy,
                            theta  = Math.atan2(dy, dx),
                            radius = Math.sqrt(dx*dx + dy*dy);

                        link.impact_route = points.map(function(point) {
                            var dx = point.x - sx,
                                dy = point.y - sy;

                            return {t: Math.atan2(dy, dx) - theta,
                                    r: Math.sqrt(dx*dx + dy*dy) / radius};
                        });
                    }
                });

                // Shift the subgraph if need be, so the subgraphs do
                // not get tangled up in the cola layout. Cola will
                // rearrange the subgraphs due to the handleDisconnected
                // setting, so the exact placement doesn't matter.

                if (y_shift) {
                    nodes.forEach(function(n) {
                        n.y += y_shift;
                    });
                }

                y_shift += g.graph().height + 100;
            });

            this.force.constraints(constraints);
            this.linkPath = this.linkImpact.bind(this);
            this.routing = 2;
        }
        else if (layout === 2) {
            // Hierarchical layout based on depth from root node

            constraints = [];

            this.force.links().forEach(function(link) {
                if (link.target.depth < link.source.depth) {
                    constraints.push({
                        "axis"  : "y",
                        "left"  : cola_idx[link.target.id],
                        "right" : cola_idx[link.source.id],
                        "gap"   : 180
                    });
                }
                else if (link.source.depth < link.target.depth) {
                    constraints.push({
                        "axis"  : "y",
                        "left"  : cola_idx[link.source.id],
                        "right" : cola_idx[link.target.id],
                        "gap"   : 180
                    });
                }
            });
            this.force.constraints(constraints);

            if (!this.showing_labels) {
                this.nodes_group.selectAll("g")
                    .each(function(d) {
                        var icon_width = d.node_icon_width + 20;
                        d.width  = (objref.HIERARCHICAL_SIZE > icon_width) ? objref.HIERARCHICAL_SIZE : icon_width;
                        d.height = objref.HIERARCHICAL_SIZE;
                    });
                this.force.linkDistance(bindContext(this, function(link) {
                    return this.NO_LABELS_LENGTH * link.length;
                }));
            }
        }
        else {
            // Force-directed layout

            this.force.constraints([]);
            this.options.layout = 0;

            if (!this.showing_labels) {
                this.nodes_group.selectAll("g")
                    .each(function(d) {
                        d.width  = d.node_icon_width + 20;
                        d.height = objref.NODE_SIZE + 20;
                    });
            }
        }
    },

    // Change the current layout
    //
    changeLayout : function(lnum) {
        "use strict";

        autocloser.forceClose();

        this.force.stop();
        this.force.on("tick", undefined);

        if (lnum > 3 || lnum < 0) {
            lnum = 0;
        }

        if (this.options.layout !== lnum) {
            this.options.layout = lnum;
            // Ensure we are using the standard link style.
            this.routing  = 0;
            this.linkPath = this.linkArc.bind(this);
        }

        this.saveVizOptions();
        this.force.handleDisconnected(true);
        this.setLayoutConstraints();
        this.startLayout(this.options.layout_iterations.change_layout);
        this.layoutTransition(true);

        if (this.pushEvent !== undefined) {
            this.pushEvent(this.EVENT_LAYOUT_CHANGE, {
                new_layout : lnum
            });
        }
        this.prev_layout = lnum;
    },

    defineShowHideDelayed: function() {
        "use strict";

        this.showHideDelayed = debounce(bindContext(this, function() {
            // Check if hidden_kinds were changed
            if (this.hasHiddenKindsChanged()) {
                // redraw memorized collections
                if (this.show_hide_state.affected_collections.length > 0) {
                    this.show_hide_state.affected_collections.forEach(function(c) {
                        if (!this.collectionMemberKindsHidden(c)) {
                            this.redrawCollectionNode(c);
                        }
                    }, this);
                }

                this.refreshLayout(bindContext(this, function() {
                    if (this.pushEvent) {
                        this.pushEvent(this.EVENT_NODE_VISIBILITY_CHANGE, {});
                    }
                }));
            }

            this.show_hide_state.hidden_kinds         = undefined;
            this.show_hide_state.affected_collections = undefined;
        }), 400); // 400ms delay is more optimal and smooth then 300ms
    },


    // Show / hide a node kind
    //
    showHide: function(kind, show) {
        "use strict";

        // Memorize initial hidden kinds
        // Store initial value of hidden kinds, in order not to perform any operations if
        // node kinds properties were not changed
        if (!this.show_hide_state.hidden_kinds) {
            this.show_hide_state.hidden_kinds = copyObject(this.hidden_kinds);
        }

        // Memorize affected collections
        this.updateShowHideAffectedCollectionsList(kind);

        if (show) {
            delete this.hidden_kinds[kind];
        }
        else {
            this.hidden_kinds[kind] = true;
        }

        this.showHideDelayed();
    },

    // Based on show hide operation node kind, finds the collection nodes that should be
    // affected and memorize them in order to run redraw operation once.
    // kind - {String}  - node kind that was clicked to show or hide
    //
    updateShowHideAffectedCollectionsList: function(kind) {
        "use strict";

        if (!this.show_hide_state.affected_collections) {
            this.show_hide_state.affected_collections = [];
        }

        var affected_collections = this.all_nodes.filter(function(node) {
            return (node.members !== undefined) &&
                (kind in node.member_kinds) &&
                (node.visible) &&
                this.show_hide_state.affected_collections.indexOf(node) === -1;
        }, this);

        this.show_hide_state.affected_collections =
            this.show_hide_state.affected_collections.concat(affected_collections);
    },

    // Compare memorized hidden kinds value with the value after user clicked show/hide elements
    hasHiddenKindsChanged: function() {
        "use strict";

        var old_hidden_kinds = Object.keys(this.show_hide_state.hidden_kinds),
            new_hidden_kinds = Object.keys(this.hidden_kinds);

        if (old_hidden_kinds.length === new_hidden_kinds.length) {
            for (var i = 0; i < old_hidden_kinds.length; i++) {
                var old_kind = old_hidden_kinds[i];

                if (new_hidden_kinds.indexOf(old_kind) === -1) {
                    return true;
                }
            }

            return false;
        }

        return true;
    },

    // Get hidden node kinds mapped to the number of nodes for each kind.
    //
    getHideableNodeKinds : function () {
        "use strict";

        if (!this.all_nodes) {
            return {};
        }

        // Count everything, including collections (if they are there)
        var has_collections = this.isCollectionNode !== undefined,
            kinds_counts    = {},
            add_kind        = function (kind, count) {
                if (count === undefined) {
                    count = 1;
                }

                if (kind in kinds_counts) {
                    kinds_counts[kind] += count;
                }
                else {
                    kinds_counts[kind] = count;
                }
            };

        this.all_nodes.forEach(function(node) {
            if (has_collections && this.isCollectionNode(node)) {
                // Add collection member kinds, but subtract:
                // - member kinds for expanded members (that exist in
                //   this.nodes_map and are not hidden) - treated as normal nodes

                if (node.expanded || node.removed || node.fake) {
                    // If a collection is expanded or removed or marked as fake (hulls),
                    // then all the collapsed members are not visible. Only count
                    // individual expanded members.
                    return;
                }

                for (var kind in node.member_kinds) {
                    // jshint -W083
                    var expanded_kind_members = node.members.filter(function (node_id) {
                            var member = this.nodes_map[node_id];

                            return (member && member.kind === kind &&
                                    !(member.removed || member.fake || member.hidden));
                        }, this),
                        add_count = node.member_kinds[kind] - expanded_kind_members.length;
                    // jshint +W083

                    if (add_count > 0) {
                        add_kind(kind, add_count);
                    }
                }
            }

            // not a collection - ordinary node or an expanded collection member
            // - removed - explicitly removed nodes
            // - fake    - hulls
            // - hidden  - hidden because collection is collapsed or shouldn't
            //             be shown due to some other logic
            else if (!(node.removed || node.fake || node.hidden)) {
                if(node.kind && node.kind != ''){
                	add_kind(node.kind);
				}
            }
        }, this);

        return kinds_counts;
    },

    // Return the count of explicitly hidden nodes.
    //
    getHiddenNodesCount : function () {
        "use strict";

        var total       = 0,
            kind_counts = this.getHideableNodeKinds();

        d3.keys(kind_counts).forEach(function (kind) {
            if (this.hidden_kinds[kind]) {
                total += kind_counts[kind];
            }
        }, this);

        return total;
    },

    // Remove a node from the view.
    //
    // d                 - A single node data object or an array of node data
    //                     objects.
    // callback          - optional: Function to execute after the node has
    //                     been removed/hidden.
    // layout_iterations - optional: Array of layout iterations to apply.
    //
    removeNode : function (d, callback, layout_iterations) {
        "use strict";

        if (!layout_iterations) {
            layout_iterations = this.options.layout_iterations.hide_node;
        }

        [].concat(d).forEach(bindContext(this, function (item) {
            this._preRemoveNode(item);
        }));

        this._setVisibilityFlag(d, true, false);
        this.refreshLayout(callback, layout_iterations);

        this.activateRemovedNodesTab();

        if (this.pushEvent) {
            this.pushEvent(
                this.EVENT_NODE_VISIBILITY_CHANGE,
                {
                    "nodes"  : [].concat(d),
                    "flag"   : true,
                    "hidden" : false,
                    "removed": true
                }
            );
        }
    },

    // Hide a node from the view.
    //
    // d                 - A single node data object or an array of node data
    //                     objects.
    // callback          - optional: Function to execute after the node has
    //                     been removed/hidden.
    // layout_iterations - optional: Array of layout iterations to apply.
    //
    hideNode : function (d, callback, layout_iterations) {
        "use strict";

        if (!layout_iterations) {
            layout_iterations = this.options.layout_iterations.hide_node;
        }

        this._setVisibilityFlag(d, true, true);
        this.refreshLayout(callback, layout_iterations);
    },

    // Re-add (restore) a node which has been previously removed.
    //
    // d                 - A single node data object or an array of node data
    //                     objects.
    // callback          - optional: Function to execute after
    //                     the node has been added.
    // layout_iterations - optional: Array of parameters to be passed to cola
    //                     force.start method.
    //
    restoreNode : function (d, callback, layout_iterations) {
        "use strict";

        if (!layout_iterations) {
            layout_iterations = this.options.layout_iterations.restore_node;
        }

        var render_changes = false,
            data_to_restore = {
                links: [],
                nodes: {}
            },
            instantly_removed = d,
            initially_removed_exist;

        [].concat(d).forEach(function (item) {
            render_changes = this._preRestoreNode(item, data_to_restore) || render_changes;
        }, this);

        initially_removed_exist = Object.keys(data_to_restore.nodes).length > 0;

        // Some times we have cases when restoring initially removed nodes and
        // nodes removed during current session both in one go (e.g. by kind).
        // If restoring only not initially removed nodes just change flag 'removed'
        // to false in _setVisibilityFlag() and refreshLayout().
        if (render_changes) {

            // We need to collect not initially removed nodes only because other
            // will be handled in _handleData().
            if (initially_removed_exist) {
                instantly_removed = d.filter(function(node) {
                    return !data_to_restore.nodes[node.id];
                });
            }

            this._setVisibilityFlag(instantly_removed, false, false);
        }

        if (initially_removed_exist) {
            // Properly include the initially removed node/nodes in the visualization.
            // This is similar to how collections are expanded and will render
            // the change as well.
            this._handleData(data_to_restore);
        }
        else {
            // If restoring not initially removed nodes just refresh layout for
            // them
            this.refreshLayout(callback, layout_iterations);
        }

        if (this.pushEvent) {
            this.pushEvent(
                this.EVENT_NODE_VISIBILITY_CHANGE,
                {
                    "nodes"  : [].concat(d),
                    "flag"   : false,
                    "hidden" : false,
                    "removed": true
                }
            );
        }
    },

    // Unhide a previously hidden node.
    //
    // d                 - A single node data object or an array of node data
    //                     objects.
    // callback          - optional: Function to execute after
    //                     the node has been added.
    // layout_iterations - optional: Array of parameters to be passed to cola
    //                     force.start method.
    //
    unhideNode : function (d, callback, layout_iterations) {
        "use strict";

        if (!layout_iterations) {
            layout_iterations = this.options.layout_iterations.restore_node;
        }

        this._setVisibilityFlag(d, false, true);
        this.refreshLayout(callback, layout_iterations);
    },

    // What should happen before a node is removed.
    // The default action is a no-op.
    //
    _preRemoveNode : function (d) {
        "use strict";
    },

    // What should happen before a node is restored.
    //
    // This function should return:
    // - false, if there's nothing to render and/or the function has taken care
    //   of setting the state and rendering changes.
    // - true - normal node restore procedure should be applied
    //
    _preRestoreNode : function (d) {
        "use strict";

        return true;
    },

    // Generic, low-level function for changing visibility of nodes and links.
    //
    _setVisibilityFlag : function (d, flag, is_hidden) {
        "use strict";

        // if group of nodes is removed in one go, all of them should be assigned same time
        var remove_seq = Date.now();

        [].concat(d).forEach(bindContext(this, function (item) {
            if (!item) {
                // invalid node - continue
                return;
            }

            if (is_hidden) {
                item.hidden = flag;
            }
            else {
                item.removed = flag;
            }

            // Save node removal time to the removed_seq attribute to have
            // the most recent items at the top of the "Removed nodes" list
            if (flag && !is_hidden) {
                item.removed_seq = remove_seq;
            }
            // Delete removed_seq attribute if node has been restored
            else if (!flag && !is_hidden) {
                delete item.removed_seq;
            }
        }));

        var filterApplied = false;
        this.all_links.forEach(function(node) {
            if(node.removed) {
                filterApplied =  true;
                return false;
            }
        });

        if(filterApplied) {
            this.filterRelApplied = true;  
            document.getElementsByClassName('sidebar-show-hide')[0].src = this.options.images.removednodes;
        } else {
            this.filterRelApplied = false;
            if(Object.keys(this.hidden_kinds).length == 0)
                document.getElementsByClassName('sidebar-show-hide')[0].src = this.options.images.filterIcon;
        }

    },

    refreshLayout: function(callback, layout_iterations) {
        "use strict";

        if (!layout_iterations) {
            layout_iterations = this.options.layout_iterations.default;
        }

        this.force.stop();
        this.force.on("tick", undefined);

        this.updateLayout();        // will set .visible attribute on item

        if (this.options.layout !== 0) {
            this.setLayoutConstraints();
        }

        this.updateSVG(false, bindContext(this, function() {
            var do_zoom = this.options.layout === 1;

            this.startLayout(layout_iterations);
            this.layoutTransition(do_zoom, do_zoom ? undefined
                                                   : bindContext(this, this.calculateFitZoom));

            if (typeof callback === "function") {
                callback();
                var selectionCount = this.getSelectedIds().length;
                if(this.vis_nodes.length == 0){
                    this.closeKey();
                }
                if(selectionCount != 1){
                    enableAnalyzeImpactButton(false);
                }else{
                    updateDetailHeader();
                    enableAnalyzeImpactButton(true);
                }        
                enableLinkMenuItem(selectionCount);
            }
        }));
    },

    //
    // Creates and returns svg element with icon
    // corresponding to node kind, based on shape or img
    //
    //  node_kind - kind of node element like SoftwareInstance, so on
    //  is_root   - indicator if we are drawing a shape icon for a root node
    createNodeIconElement: function (node_kind, is_root) {
        "use strict";

         return (this.options.icons === undefined) ?
                this._createShapeIcon(node_kind) : this._createImageIcon(node_kind, is_root);
    },

    _createShapeIcon: function (node_kind) {
        "use strict";

        var svg = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
            .attr("width", "28").attr("height", "26");

            svg.append("g")
            .attr("transform", "translate(12,14) scale(1.5)")
            .append("use")
            .attr("xlink:href", "#n_" + (node_kind in this.options.shapes ? node_kind : ""));

        return svg.node();
    },

    _createImageIcon: function (node_kind, is_root) {
        "use strict";

        var svg = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
            .attr("width", "36")
            .attr("height", "26");

        if (is_root === true && this.options.highlight_root) {
            svg.append("rect")
                .attr("x", 2)
                .attr("y", 2)
                .attr("height", 22)
                .attr("width", 20)
                .attr("class", "image-highlight");
        }

        var node_icon = this.options.icons[node_kind] || this.options.icons[""];

        svg.append("image")
            .attr("transform", "translate(12,14)")
            .attr("class", node_kind)
            .attr("xlink:href", node_icon[1])
            .attr("x", -8)
            .attr("y", -10)
            .attr("height", 16)
            .attr("width", 16);

        return svg.node();
    },

    // Calculate wrapped text.
    //
    wrapText : function (label, width, pos_x, pos_y) {
        "use strict";

        if (label === undefined || label.empty()) {
            console.log("No label is provided to wrapText.");
            return;
        }

        var words = label.text().split(/\s+/).reverse(),
            word,
            line = [],
            line_no = 0,
            line_height = 1.1, // ems
            i,
            x = pos_x === undefined ? 0 : pos_x,
            y = pos_y === undefined ? 20 : pos_y,
            dy = 0.0,
            delim,
            delims = [ "/", "\\", ".", "-", "_", "" ],
            split_word,
            part_word,
            tspan = label.text(null)
                .append("tspan")
                .attr("id","wrapTextTspan")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", dy + "em");

        while (!!(word = words.pop())) { // Convert assignment to conditional
                                         // expression via !!

            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                if (line.length > 1) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [ word ];
                    tspan = label.append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", ++line_no * line_height + dy + "em")
                        .text(word);
                }

                if (tspan.node().getComputedTextLength() > width * 1.75) {
                    // Word is very long. Try to split it on a delimiter.

                    for (i=0; i < delims.length; ++i) {
                        delim      = delims[i];
                        split_word = word.split(delim).reverse();

                        if (split_word.length < 2) {
                            continue;
                        }

                        part_word = [ split_word.pop() ];
                        tspan.text(part_word.join(delim) + delim);

                        while (tspan.node().getComputedTextLength() <= width) {
                            part_word.push(split_word.pop());
                            tspan.text(part_word.join(delim) + delim);
                        }

                        split_word.push(part_word.pop());

                        if (part_word.length > 0) {
                            word = part_word.join(delim) + delim;
                            line = [ word ];
                            tspan.text(word);
                            words.push(split_word.reverse().join(delim));
                            break;
                        }
                    }
                    if (part_word.length === 0) {
                        tspan.text(word);
                    }
                }
            }
        }
    },

    // Define markers and other SVG shapes in the top-level SVG element.
    //
    // Such shapes can then be used in SVG like this:
    //  <use xlink:href="#marker-id" x="10"></use>
    //
    _defineMarkers : function () {
        "use strict";

        // Per-type markers, as they don't inherit styles.
        this.svg.append("defs")
            .selectAll("marker")
            .data(this.options.relationships.concat([["Unknown", ""]]))
            .enter().append("marker")
            .attr("id", function(d) { return d[0]; })
            .attr("viewBox", "0 -4 8 8")
            .attr("refX", 6)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-3L6,0L0,3");

        // define node shapes as SVG paths
        this.svg.append("defs")
            .selectAll("path")
            .data(d3.entries(this.options.shapes))
            .enter().append("g")
            .attr("id", function(d) { return "n_" + d.key; })
            .attr("class", function(d) { return d.key || "node"; })
            .attr("transform", function(d) { return d.value[2]; })
            .selectAll("path")
            .data(function(d) { return (typeof d.value[1] === "string" ?
                                        [d.value[1]] : d.value[1]); })
            .enter().append("path")
            .attr("d", function(d) { return d; });
    },

    // Node links with a multiplier for the arc radius
    //
    linkArcMul : !tw.viz.isBrowserIE() ? function (d, dr_mul) {
        "use strict";
        // If the source or target don't have coordinates yet don't
        // return anything
        //
        var link_attr = this._findLinkAttributes(d);

        if (link_attr === undefined) {
            return "";
        }

        var dr = link_attr.dr * dr_mul;
        
        return "M" + link_attr.sx + "," + link_attr.sy + "A" +
            dr + "," + dr + " 0 0,1 " +
            link_attr.tx + "," + link_attr.ty;
        
    } : function (d, dr_mul) {
        "use strict";

        // Complicated version for IE where arrow markers do not work
        // correctly.
        var link_attr = this._findLinkAttributes(d);

        if (link_attr === undefined) {
            return "";
        }

        var dx = link_attr.tx - link_attr.sx,
            dy = link_attr.ty - link_attr.sy,
            curve_angle = Math.PI / 12,
            arrow_angle = Math.PI / 10,
            line_angle = Math.atan(dy/dx) + (link_attr.tx > link_attr.sx ? Math.PI : 0) + curve_angle,
            arm1_angle = line_angle - arrow_angle - curve_angle,
            arm2_angle = line_angle + arrow_angle + curve_angle/1.5,
            arm_len    = 8,
            arm1_x = Math.cos(arm1_angle) * arm_len,
            arm1_y = Math.sin(arm1_angle) * arm_len,
            arm2_x = Math.cos(arm2_angle) * arm_len,
            arm2_y = Math.sin(arm2_angle) * arm_len,
            dr = link_attr.dr * dr_mul;

        return ("M" + link_attr.tx + "," + link_attr.ty + "l" + arm1_x + "," + arm1_y +
                "M" + link_attr.tx + "," + link_attr.ty + "l" + arm2_x + "," + arm2_y +
                "M" + link_attr.sx + "," + link_attr.sy + "A" + dr + "," + dr +
                " 0 0,1 " + link_attr.tx + "," + link_attr.ty);
    },

    linkArc : function (d) {
        "use strict";
        return this.linkArcMul(d, 1);
    },
    
    linkArcFlat : function (d) {
        "use strict";

        // A "flat" link arc that is very close to a straight line,
        // used in transitions.
        return this.linkArcMul(d, 20);
    },

    linkOrtho : function(link) {
        "use strict";

        var link_attr = this._findLinkAttributes(link);
        if (link_attr === undefined) {
            return "";
        }

        if (link.orth_route === undefined) {
            // Straight line
            return "M" + link_attr.sx + "," + link_attr.sy + "L" +
                   link_attr.tx + "," + link_attr.ty;
        }

        var sx = link_attr.sx,
            sy = link_attr.sy,
            dx = link_attr.tx - sx,
            dy = link_attr.ty - sy;

        return cola.GridRouter.getRoutePath(link.orth_route.map(function(seg) {
            return [{x: seg[0].x * dx + sx,
                     y: seg[0].y * dy + sy},
                    {x: seg[1].x * dx + sx,
                     y: seg[1].y * dy + sy}];
        }), 10, 3, 7).routepath;
    },

    linkMultiLine : function(link) {
        "use strict";

        var link_attr = this._findLinkAttributes(link);
        if (link_attr === undefined) {
            return "";
        }

        if (link.multiline_route === undefined) {
            // Straight line
            return "M" + link_attr.sx + "," + link_attr.sy + "L" +
                   link_attr.tx + "," + link_attr.ty;
        }

        var points = [],
            sx     = link_attr.sx,
            sy     = link_attr.sy,
            dx     = link_attr.tx - sx,
            dy     = link_attr.ty - sy,
            theta  = Math.atan2(dy, dx),
            radius = Math.sqrt(dx*dx + dy*dy);

        points.push({x: link_attr.sx,
                     y: link_attr.sy});

        link.multiline_route.forEach(function(coord) {
            var t = coord.t + theta,
                r = coord.r * radius;

            points.push({x: r * Math.cos(t) + sx,
                         y: r * Math.sin(t) + sy});
        });
        points.push({x: link_attr.tx,
                     y: link_attr.ty});

        return this.basis_line(points);
    },

    linkImpact : function(link) {
        "use strict";

        var link_attr = this._findLinkAttributes(link);
        if (link_attr === undefined) {
            return "";
        }

        if (link.impact_route === undefined) {
            // Straight line
            return "M" + link_attr.sx + "," + link_attr.sy + "L" +
                   link_attr.tx + "," + link_attr.ty;
        }

        var points = [],
            sx     = link_attr.sx,
            sy     = link_attr.sy,
            dx     = link_attr.tx - sx,
            dy     = link_attr.ty - sy,
            theta  = Math.atan2(dy, dx),
            radius = Math.sqrt(dx*dx + dy*dy);

        link.impact_route.forEach(function(coord) {
            var t = coord.t + theta,
                r = coord.r * radius;

            points.push({x: r * Math.cos(t) + sx,
                         y: r * Math.sin(t) + sy});
        });

        return this.basis_line(points);
    },

    linkImpactFlat : function(link) {
        "use strict";

        // A "flat" impact line that is essentially a straight line,
        // with enough segments that a transition can turn it into the
        // required non-flat path.

        var link_attr = this._findLinkAttributes(link);
        if (link_attr === undefined) {
            return "";
        }

        if (link.impact_route === undefined) {
            // Straight line
            return "M" + link_attr.sx + "," + link_attr.sy + "L" +
                   link_attr.tx + "," + link_attr.ty;
        }

        var points = [],
            sx     = link_attr.sx,
            sy     = link_attr.sy,
            dx     = link_attr.tx - sx,
            dy     = link_attr.ty - sy,
            theta  = Math.atan2(dy, dx),
            cos_t  = Math.cos(theta),
            sin_t  = Math.sin(theta),
            radius = Math.sqrt(dx*dx + dy*dy);

        link.impact_route.forEach(function(coord) {
            var r = Math.min(coord.r * Math.cos(coord.t) * radius, radius);
            if (r < 0)
                r = 0;

            points.push({x: r * cos_t + sx,
                         y: r * sin_t + sy});
        });

        // Force start and end points to the default link, not the
        // path constructed by Dagre.
        points[0]               = {x:sx, y:sy};
        points[points.length-1] = {x: link_attr.tx, y: link_attr.ty};

        return this.basis_line(points);
    },
    
    _findLinkAttributes : function (d) {
        "use strict";

        if (d.target.x === undefined || d.source.x === undefined) {
            // one of the nodes has just been added to the visualization
            // (doesn't have a proper coordinate yet)
            return undefined;
        }

        var sx = d.source.x,
            sy = d.source.y - d.source.y_offset,
            tx = d.target.x,
            ty = d.target.y - d.target.y_offset,
            si,
            ti,
            dx,
            dy,
            coordinates;

        if (this.isCollectionNode && this.isCollectionNode(d.source)) {
            si = this._findLinkToRectIntersectionPoint(d.source, tx, ty, sx, sy);
        }
        else {
            si = this._findLinkToCircleIntersectionPoint(tx, ty, sx, sy);
        }

        if (this.isCollectionNode && this.isCollectionNode(d.target)) {
            ti = this._findLinkToRectIntersectionPoint(d.target, sx, sy, tx, ty);
        }
        else {
            ti = this._findLinkToCircleIntersectionPoint(sx, sy, tx, ty);
        }

        dx = ti.x - si.x;
        dy = ti.y - si.y;

        return {
            sx: si.x,
            sy: si.y,
            tx: ti.x,
            ty: ti.y,
            dr: Math.sqrt(dx * dx + dy * dy) * 2
        };
    },

    _findLinkToRectIntersectionPoint : function (p, x1, y1, x2, y2) {
        "use strict";

        var cross_point = cola.vpsc.makeEdgeTo(
                {x: x1, y: y1},
                (new cola.vpsc.Rectangle(x2 - p.node_icon_width/2,
                    x2 + p.node_icon_width/2,
                    y2 - 10, y2 + 10)),
                0);

        if (isNaN(cross_point.x) || isNaN(cross_point.y)) {
            // Sometimes cola fails for some reason, in which case,
            // pretend the target was circular.
            return this._findLinkToCircleIntersectionPoint(x1, y1, x2, y2);
        }

        return {x: cross_point.x, y: cross_point.y};
    },

    _findLinkToCircleIntersectionPoint : function (x1, y1, x2, y2) {
        "use strict";

        var node_radius = this.NODE_SIZE/ 2,
            dx = x2 - x1,
            dy = y2 - y1,
            gamma = Math.atan2(dy, dx);

        return {x: x2 - (Math.cos(gamma) * node_radius),
                y: y2 - (Math.sin(gamma) * node_radius)};
    },

    openNodeInNewTab : function (d) {
        "use strict";
		showPopup("bmc_baseelement__c", d.actualId,"ciexplorer")
        // this.navigateToNode(d, true);
    },

    //
    // Side bar menu

    // Add sidebar menu items from this.SIDE_BAR_MENU_ITEMS.
    //
    // Items are three element lists, or functions that return three
    // element lists:
    //
    // [ show expand menu,
    //   icon path,
    //   menu label,
    //   function to construct the expand element,
    //   options (optional) ]
    //
    // If the icon path is undefined then the menu point will not be shown.
    //
    // The function for constructing the expand element gets the expand
    // element as parameter.
    //
    addSideBarMenuItems : function () {
        "use strict";

        this.addGeneralSideBarMenuItems();
    },

    addGeneralSideBarMenuItems : function () {
        "use strict";

        // Create common menus

        this.SIDE_BAR_MENU_ITEMS.push(

            // Drag mode

            bindContext(this, function () {
                if (this.mouse_mode !== 0) {
                    return [
                        false,
                        this.options.images.drag_normal,
                        labels.SelectMode,
                        bindContext(this, this.dragMode),
                        {
                            tooltip : labels.SwitchToDragMode,
                            alt     : "Mouse mode is set to SELECT, click to set to DRAG",
							className: "select-mode"
                        }
                    ];
                }
                return [];
            }),

            // Layout

            [
                true,
                this.options.images.sidebar_layout,
                labels.Layout,
                bindContext(this, this._showLayoutSidebar),
                {
                    tooltip : labels.ChangeTheLayoutOfTheDisplay,
                    alt     : "Icon indicating an openable layout menu",
					className: 'sidebar-layout'
                }
            ],

            // Show / Hide
			
			// Relationship Filter

            bindContext(this, function() {
				return [
					true,
                    (Object.keys(this.hidden_kinds).length == 0 && this.filterRelApplied == false) ? this.options.images.filterIcon : this.options.images.removednodes,
					labels.ShowHide,
					bindContext(this, this._openFilterSideBar),
					{
						tooltip : labels.ShowHide,
						alt     : "",
						className: "sidebar-show-hide"
					}
				];
            }),

            // Export

            [
                true,
                this.options.images.exportsidebar,
                labels.Export,
                bindContext(this, this._showExportSidebar),
                {
                    tooltip : labels.ExportAndPrint,
                    alt     : "Icon indicating an openable export menu",
					className: "sidebar-export"
                }
            ]
			
			
        );
		
		if(isSettingPageVisible) {
			// Open Setting
			this.SIDE_BAR_MENU_ITEMS.push(
				[
					true,
					this.options.images.settings_logo,
					labels.Settings,
					bindContext(this, this._openSettings),
					{
						tooltip : labels.Settings,
						alt     : "",
						className: "sidebar-settings"
					}
				]
			);
		}
    },

    //
    // Context menu

    // Add context menu items from this.CONTEXT_MENU_ITEMS.
    //
    // Items can be:
    // - null (for separators)
    // - three-element arrays
    // - four-element arrays
    // - functions that return three or four element arrays:
    //
    //  [
    //    // mandatory:
    //    menu item label (can be a function),          // or null for separator
    //    true if item is enabled (can be a function),
    //    function to call on click,
    //
    //    // optional:
    //    menu item pop-up description ("title" attribute) (can be a func.)
    //  ]
    //
    // All "can be a function" elements described above, if they are functions
    // should take (datum, target) arguments.
    //
    // The callback should take arguments:
    // (datum, target, top_position, scaled_position)
    //
    // Labels with null value (or if a function responsible for label returns
    // null) are transformed to menu separators.
    //
    // The context menu can have 3 top-level "categories" - "node", "link" and
    // "background". These are totally independent and determine what menu
    // options are displayed when you right-click a node, link or the
    // visualization background.
    //
    addContextMenuItems : function () {
        "use strict";

        this.addGeneralContextMenuItems();
    },

    addGeneralContextMenuItems : function () {
        "use strict";

        // Create common menus

        this.CONTEXT_MENU_ITEMS["node"] = [
            [ labels.OpenNewTab,
              bindContext(this, function() {
                  return this.options.nodes_clickable;
              }),
              bindContext(this, this.openNodeInNewTab) ]
        ];

        this.CONTEXT_MENU_ITEMS["background"] = [
            
        ];

        this.CONTEXT_MENU_ITEMS["link"] = [];
    },

    // Show the context menu
    //
    showContextMenu : function () {
        "use strict";

        d3.event.preventDefault();

        // Don't show context menus when visualization is in the node picker mode.
        if (this.node_picker_mode) {
            return;
        }

        var top_position    = d3.mouse(this.svg.node()),
            scaled_position = d3.mouse(this.container.node()),
            target          = d3.select(d3.event.target),  // What was clicked?
            datum           = target.datum(),
            target_kind     = "background",
            sel;

        // Inside IE there is different behaviour, click on <use href="xlink:">
        // is handled as a click on element which xlink points to
        // we need to manually change target to the proper node with datum

        // TODO remove this after d3 will be updated at least to v3.5.15
        if ((Prototype.Browser.IE || Prototype.Browser.Edge) && Object.isUndefined(datum) &&
            d3.event.target.correspondingUseElement) {

            target = d3.select(d3.event.target.correspondingUseElement);
            datum = target.datum();
        }

        //donot add menu to non ci/asset type node
        if(typeof datum != 'undefined' && typeof datum.instType === 'string' && datum.instType == ''){
            return;
        }

        if (datum !== undefined) {
            sel         = this._getContextMenuSelection(datum);
            target_kind = sel.target_kind;

            // Update target to the top-level item
            target = sel.items.filter(function(x) {
                return x.id === datum.id;
            });
        }

        // Construct the menu
        var menu_items = this.CONTEXT_MENU_ITEMS[target_kind],
            ins_sep    = false;

        // Remove everything under context_menu_items and reconstruct the elements
        this.context_menu_items
            .selectAll("*")
            .remove();

        menu_items.forEach(function (d) {
            if (typeof d === "function") {
                d = d(datum, target);
            }

            if (d === undefined) {
                // Ignore
                return;
            }
            else if (d === null) {
                if (!ins_sep) {
                    // Separator
                    this.context_menu_items
                        .append("li")
                        .append("div")
                        .attr("class", "hr");
                    ins_sep = true;
                }
                return;
            }

            var label = d[0];
            if (typeof label === "function") {
                label = label(datum, target);
            }

            if (label) {
                var enabled = d[1];
                if (typeof enabled === "function") {
                    enabled = enabled(datum, target);
                }

                // optional (if not present, replaced by empty string)
                var title = d[3];
                if (typeof title === "function") {
                    title = title(datum, target);
                }

                if (enabled) {
                    var a = this.context_menu_items
                        .append("li")
                        .append("button")
                        .attr("type", "button")
                        .attr("title", title || "")
                        .classed("regularAction", true)
                        .text(label);

                    a.on("click", function() {
                        d[2](datum, target, top_position, scaled_position);
                    });
                }
                else {
                    this.context_menu_items
                        .append("li")
                        .append("span")
                        .attr("class", "disabledAction")
                        .attr("title", title || "")
                        .text(label);
                }
                ins_sep = false;
            }
            return false;
        }, this);

        // remove separator item if it's the last menu item
        // (no-op if no such separator)
        this.context_menu_items
            .select("li:last-child div.hr").remove();

        // Display the menu
        this.context_menu_div
            .style("left", top_position[0] + "px")
            .style("top", top_position[1] + "px")
            .style("display", "inline-block");

        // Check if actionMenuDropdown will be displayed under visualisation bottom border

        var context_menu_offset = this.context_menu_div.node().getBoundingClientRect();

        if ((context_menu_offset.height + this.context_menu_div.node().offsetTop) >
            this.viz_container.node().clientHeight) {

            this.context_menu_div
                .style("top", top_position[1] - context_menu_offset.height + "px");
        }

        // Check if actionMenuDropdown will be displayed under view port bottom border

        if ((context_menu_offset.height + context_menu_offset.top) >
              document.documentElement.clientHeight) {

            this.context_menu_div
                .style("top", top_position[1] - context_menu_offset.height + "px");
        }

        // Check if actionMenuDropdown will be displayed under visualisation right border

        if ((context_menu_offset.width + this.context_menu_div.node().offsetLeft) >
            this.svg_width) {

            this.context_menu_div
                .style("left", this.svg_width - context_menu_offset.width + "px");
        }

        var closeContextMenu = bindContext(this, function () {
            this.context_menu_div.style("display", "none");
            d3.select("body").on("click.contextMenu", null);
            d3.select("body").on("keydown.contextMenu", null);
            this.back_rect.on(".contextMenu", null);
        });

        // For context menu to hide on left-click, we need to listen not only
        // on "body" element, but also on the SVG for mousedowns.
        // This is because in "select" mode, mouse events are captured so that
        // no clicks come through.
        d3.select("body").on("click.contextMenu", closeContextMenu);
        this.back_rect.on("mousedown.contextMenu", closeContextMenu);

        d3.select("body").on("keydown.contextMenu", function() {
            // 27 is Escape
            if (d3.event.keyCode === 27) {
                closeContextMenu();
            }
        });
    },

    _getContextMenuSelection : function (datum) {
        "use strict";

        var target_kind,
            items;

        if (datum.short_name) {
            target_kind = "node";
            items = this.node_sel;
        }
        else if (datum.source) {
            target_kind = "link";
            items = this.link_sel;
        }

        return { items : items, target_kind : target_kind };
    },

    //
    // Manual groups

    showManualGroupsKey : function () {
        "use strict";

        var body_div = d3.select(document.createElement("div")),
            table = body_div.append("table")
                .attr("width", "100%");

        if (Object.keys(this.manual_group_color_map).length) {
            this._constructNodeGroupKey("model_def", table);
            this._constructNodeGroupKey("manual_group", table);
        }
        else {
            table.append("tr")
                .append("td")
                .text("No Model Definitions or Manual Groups in this visualization.");
        }

        this.showKey({
            head: "Node Membership Information",
            body: body_div
        });
    },

    _constructNodeGroupKey : function (group_type, table) {
        "use strict";

        if (this.manual_group_color_map[group_type] === undefined) {
            return;
        }

        var all_group_info = Object.keys(this.manual_group_color_map[group_type]),
            tr;

        table.append("tr")
            .append("td")
            .attr("colspan", "4")
            .style({
                    "text-align": "center",
                    "vertical-align": "middle"
            })
            .text(group_type === "manual_group" ? "Manual Groups" : "Model Definitions");

        all_group_info.forEach(function (group_id, idx) {
            var group_info = this.manual_group_color_map[group_type][group_id];

            var group_name  = group_info.name,
                group_color = group_info.color;

            if (idx === 0 || idx % 2 === 0) {
                tr = table.append("tr");
            }

            if (group_type === "manual_group") {
                tr.append("td")
                    .append("div")
                    .style({
                        width: "28px",
                        height: "28px",
                        "border-radius": "50%",
                        "background-color": group_color
                    });
            }
            else {
                tr.append("td")
                    .append("div")
                    .style({
                        "width": 0,
                        "height": 0,
                        "border-style": "solid",
                        "border-width": "0 14px 28px 14px",
                        "border-color": "transparent transparent " + group_color + " transparent"
                    });
            }

            tr.append("td")
                .style({"vertical-align":"middle"})
                .append("a")
                .attr("href", this.options.node_view_url + group_id)
                .text(group_name);

        }, this);
    },

    showVizKey : function () {
        "use strict";

        var body_div = d3.select(document.createElement("div"));

        body_div.append("ul")
            .attr("class", "InlineVisualizationKeyList")
            .selectAll("li")
            .data([labels.ArrowsShowImpactDirection,
                   labels.IconsToNavigate,
                   labels.IconsContextMenu,
                   labels.DragIconToMove,
                   labels.DoubleClickToRecenter,
                   labels.HoldShiftToAddSelection])
            .enter().append("li")
            .text(function(d) { return d; });


        // Node kind table
        body_div.append("hr");

        var items = [];
        var vals, mid, row, item, svg, idx;

        var symbol_list = this.options.icons === undefined ? this.options.shapes
                                                           : this.options.icons;

        Object.keys(symbol_list).forEach(function (key) {
            if (key) {
                vals = symbol_list[key];
                items.push([vals[0], key, vals]);
            }
        });
        items.sort();

        var kind_table = body_div
            .append("table")
            .attr("style", "width:100%;padding-left:15px");

        mid = Math.ceil(items.length / 2);

        for (idx=0; idx < mid; idx++) {
            row = kind_table.append("tr");

            item = items[idx];

            row.append("td").attr('style', 'width:10%')
                .node()
                .appendChild(this.createNodeIconElement(item[1]));

            row.append("td")
                .text(item[0])
                .attr("style", "vertical-align: middle; width: 40%");

            if (idx + mid === items.length) {
                break;
            }

            item = items[idx + mid];

            row.append("td").attr('style', 'width:10%')
                .node()
                .appendChild(this.createNodeIconElement(item[1]));

            row.append("td")
                .text(item[0])
                .attr("style", "vertical-align: middle");
        }

        // Relationship table
        body_div.append("hr");

        var rels_table = body_div.append("table").attr("style", "width:100%;padding-left:15px");
        var link_data = { source : { x : -10,  y : 8, y_offset : 0 },
                          target : { x :  36,  y : 8, y_offset : 0 } };

        mid = Math.ceil(this.options.relationships.length / 2);

        for (idx = 0; idx < mid; idx++) {
            row = rels_table.append("tr");

            item = this.options.relationships[idx];

            svg = row.append("td").attr('style', 'width:10%').append("svg")
                .attr("width", "36").attr("height", "16");

            svg.append("path")
                .attr("class", "link " + item[0])
                .style("stroke", function(d) {
                    if(item[2]){
                        if(item[2].toLowerCase() == 'black')
                            return item[2];
                        else
                            return ('#'+item[2]);
                    }else{
                        return 'black';
                    }
                })
				.style("stroke-dasharray", function(d) {
					if(item[3] == 'Solid') {
						return 0;
					} else {
						return 5;
					}
				})
                .attr("marker-end", function(d) {
					if (item[4] === "Undirected") {
						return "none";
					}
					else {
						return "url(#Unknown)";
					}
				})
                .attr("d", this.linkArc.bind(this, link_data));

            row.append("td")
                .text(item[1])
                .attr("style", "vertical-align: middle; width: 40%");

            if (idx + mid === this.options.relationships.length) {
                break;
            }

            item = this.options.relationships[idx+mid];

            svg = row.append("td").attr('style', 'width:10%')
                .append("svg")
                .attr("width", "36").attr("height", "20");

            svg.append("path")
                .attr("class", "link " + item[0])
                .style("stroke", function(d) {
                    if(item[2]){
                        if(item[2].toLowerCase() == 'black')
                            return item[2];
                        else
                            return ('#'+item[2]);
                    }else{
                        return 'black';
                    }
                })
				.style("stroke-dasharray", function(d) {
					if(item[3] == 'Solid') {
						return 0;
					} else {
						return 5;
					}
				})
                .attr("marker-end", function(d) {
					if (item[4] === "Undirected") {
						return "none";
					}
					else {
						return "url(#Unknown)";
					}
				})
                .attr("d", this.linkArc.bind(this, link_data));

            row.append("td")
                .text(item[1])
                .attr("style", "vertical-align: middle");
        }

        this.showKey({
            head: this.viz_name + " " + labels.Information,
            body: body_div
        });
    },

    //
    // Key

    showKey : function(options) {
        "use strict";
        var x_pos = window.innerWidth - 500;

        if (this.showing_key) {
            this.closeKey();
            return;
        }
        this.showing_key = true;

        if (this.key_div) {
            // Already constructed. Just display it.
            this.key_div.select("#InlineVisualizationKeyHeader").select("span").text(" " + options.head);

            this.key_div.select(".InlineVisualizationKeyBody").html(options.body.node().innerHTML);

            if (options.style) {
                this.key_div.attr("style", options.style);
            }
            else {
                this.key_div.attr("style", this.key_div_style);
            }

            if (!isElementInViewport(this.key_div.node())) {
                this.key_div.attr("style", "top: 80px; left: " + x_pos + "px");
            }

            d3.select("body").on("keydown.closeKey", bindContext(this, this.closeKeyOnEscape));
            return;
        }

        // Header

        this.key_div = this.top_div.append("div")
            .attr("class", "InlineVisualizationKey")
            .attr("id", "InlineVisualizationKey");

        if (options.style) {
            this.key_div.attr("style", options.style);
        }
        else {
            this.key_div.attr("style", "top: 70px; left: " + x_pos + "px");
        }

        var header = this.key_div.append("div")
            .attr("class", "InlineHelpHeader")
            .attr("id", "InlineVisualizationKeyHeader");
		
        header.append("img")
            .attr("src", this.options.images.legend_img)
            .attr("alt", "");

        header.append("span")
            .text(" " + options.head);

        var buttons = header.append("div")
            .attr("style", "position:absolute; top:0px; right:5px")
            .attr("class", "InlineVisualizationHeaderButtons");

        buttons
            .append("button")
            .attr("title", "Close")
            .attr("type", "button")
            .on("click", bindContext(this, this.closeKey))
            .append("img")
            .attr("alt", "Close")
            .attr("src", this.options.images.x_normal)
            .attr("onmouseout", "this.src='" + this.options.images.x_normal + "';")
            .attr("onmouseover", "this.src='" + this.options.images.x_hot + "';");

        // General instructions

        this.key_div
            .append("div")
            .html(options.body.node().innerHTML)
            .attr("class", "InlineVisualizationKeyBody");

        d3.select("body").on("keydown.closeKey", bindContext(this, this.closeKeyOnEscape));

        this.key_draggable = new Draggable("InlineVisualizationKey", {
                handle: "InlineVisualizationKeyHeader",
                revert: function (el) {
                    return !isElementInViewport(el);
                }
        });
    },
	
    /*openSearchAndLink : function() {
		openSearhAndLink();
    },
    
    createAndLink : function() {
		createLinkToNewCR();
    },

	analyzeImpact : function() {
		analyzeImpactHandler();
	},*/
	
	openWiki: function() {
		window.open(wikiUrl);
	},

    closeKey : function () {
        "use strict";
        if (this.showing_key) {
            var style = this.key_div.attr("style"),
                left  = /left:\s*(-?\d+)px/.exec(style),
                top   = /top:\s*(-?\d+)px/.exec(style);

            if (left && top) {
                this.key_div_style = "top: " + top[1] + "px; left: " + left[1] + "px";
            }

            this.key_div.attr("style", "display:none");
            this.showing_key = false;

            d3.select("body").on("keydown.closeKey", undefined);
        }
    },

    closeKeyOnEscape : function () {
        "use strict";
        // 27 is Escape
        if (d3.event.keyCode === 27) {
            this.closeKey();
        }
    },

    // State persistence
    //

    // Get the current visualization state including node positions
    // and flags. The visualization state does NOT include
    // actual node data nor purely presentational state like
    // current window position, zoom level or size.
    //
    getVizState : function () {
        "use strict";

        var nodes     = {},
            links     = [],
            all_nodes = this.all_nodes.concat(d3.values(this.removed_nodes));

        // Get relevant node state (only non-collection nodes)
        all_nodes.forEach(function (n) {
            var node_state = {},
                valid      = this._getVizStateForNode(n, node_state);

            if (valid) {
                nodes[n.id] = node_state;
            }
        }, this);

        // Get relevant link state
        this.all_links.forEach(function (l) {
            var link_state = {},
                valid      = this._getVizStateForLink(l, link_state);

            if (valid) {
                links.push(link_state);
            }
        }, this);

        return {
            extra_data : {
                viz_layout           : this.options.layout,
                viz_impact_direction : this.options.impact_direction,
                viz_show_labels      : this.options.show_labels
            },
            nodes : nodes,
            links : links
        };
    },

    // Get the viz state for node. If it returns false, skip the node
    // from being explicitly included in the nodes state. If returns true,
    // do include it.
    //
    // All the subclasses should respect the result of the super calls for this
    // method and its subclass variations.
    //
    _getVizStateForNode : function (n, state) {
        "use strict";

        if (n.fake) {
            // Fake node state, don't include it.
            // For hulls, we use extra data to persist hull memberships
            // and re-construct hull nodes frontend-side.
            return false;
        }

        state["name"]       = n.name;
        state["short_name"] = n.short_name;
        state["kind"]       = n.kind;
        state["depth"]      = n.depth;
        state["root"]       = n.root;
        state["removed"]    = n.removed === undefined ? false
                                                      : n.removed;

        state["extra_data"]  = {
            x              : n.x,
            y              : n.y,
            removed_seq    : n.removed_seq
        };

        if (n.hull) {
            state["extra_data"]["hull"] = n.hull;
        }

        return true;
    },

    _getVizStateForLink : function (l, state) {
        "use strict";

        // only include links with valid node references
        var source = this.nodes_map[l.src_id],
            target = this.nodes_map[l.tgt_id];

        // Fake links, just like fake nodes should not be included in
        // the persisted state.
        if (l.fake || (source && source.replaced) || (target && target.replaced) ||
                (l.id && (l.id.indexOf(this.LINK_COPY_PREFIX) === 0))) {
            return false;
        }

        var removed = l.removed === undefined ? false
                                              : l.removed;

        // The rel_id attribute is undefined for "made up" relationships
        // to collection nodes.

        state["rel_id"]  = l.rel_id;
        state["src_id"]  = l.src_id;
        state["tgt_id"]  = l.tgt_id;
        state["kind"]    = l.kind;
        state["removed"] = removed;

        state["extra_data"] = {
            style  : l.style,
            length : l.length
        };

        return true;
    },

    // Apply a given visualization state.
    //
    setVizState : function (data, callback) {
        "use strict";

        var parsed_nodes = {},
            parsed_links = [];

        d3.entries(data.nodes).forEach(function (entry) {
            var node_id     = entry.key;
            var node_state  = entry.value;

            var node_data   = {};

            var valid       = this._setVizStateForNode(node_data, node_state,
                                                       data);

            if (valid === true) {
                node_data.id          = node_id;
                parsed_nodes[node_id] = node_data;
            }
        }, this);

        (data.links || []).forEach(bindContext(this, function (linkState) {
            var link_data = {};
            this._setVizStateForLink(link_data, linkState);

            parsed_links.push(link_data);
        }));

        // extra data - provide default values for required parameters
        var extra_data = mergeObjects(
            {viz_layout:           tw.viz.DEFAULT_OPTIONS.layout,
             viz_impact_direction: tw.viz.DEFAULT_OPTIONS.impact_direction},
            data.extra_data
        );

        // transform the data (as dumped by getVizState) to internal format
        // acceptable by _handleData
        var parsed = {
            layout           : extra_data.viz_layout,
            impact_direction : extra_data.viz_impact_direction,

            nodes            : parsed_nodes,
            links            : parsed_links,
            rules            : data.rules
        };

        this._handleData(parsed, undefined, callback);
    },

    _setVizStateForNode : function (node, state, data) {
        "use strict";

        var extra_data  = state.extra_data;

        // TODO there should be a list of these properties defined in the class
        node.name            = state.name;
        node.short_name      = state.short_name || state.name;
        node.type            = state.type;

        node.kind            = state.kind;
        node.depth           = state.depth;
        node.root            = state.root;

        node.manual_groups   = state.manual_groups;
        node.model_defs      = state.model_defs;
        node.hull            = state.hull;
        node.color_info      = state.color_info;

        node.removed         = state.removed;

        // TODO won't be populated properly for models (yet) - need to refactor
        //      ModelDefinition maintenance first.
        //
        // TODO see getVizStateForNode (sending shared flag not implemented yet)

        node.shared          = state.shared;
        node.shared_override = state.shared_override;
        node.user_saved      = state.user_saved;

        // review suggested state (for application model "need attention" state)
        node.review_suggested = state.review_suggested;

        if (extra_data) {
            node.removed_seq = extra_data.removed_seq;

            node.hidden = (
                extra_data.visible === undefined ? false : (this.isCollectionMember(state) && !extra_data.visible)
            );

            // Only restore the explicit x, y position for visible nodes.
            //
            // Restoring positions of removed nodes can cause problems - they
            // are moved far, far away outside the bounds of the layout.

            if ( !(node.removed || node.hidden) ) {
                node.x = extra_data.x;
                node.y = extra_data.y;
            }

            node.hull = extra_data.hull ? extra_data.hull : node.hull;
        }

        return true;
    },

    _setVizStateForLink : function (link, state) {
        "use strict";

        link.rel_id  = state.rel_id;
        link.src_id  = state.src_id;
        link.tgt_id  = state.tgt_id;
        link.kind    = state.kind;
        link.style   = state.style;
        link.removed = state.removed;
    },

    // Stop all layouting and re-initialize all the nodes and links, so that
    // the visualization can be "re-started" with a completely new state.
    //
    // This does not touch the sidebar, the context menu items, the undo stack,
    // options, etc. If you want to change any of them, you should do so
    // manually.
    //
    // Simply calling _handleData afterwards should be enough to get
    // the visualization working again with new data.
    //
    reInit : function () {
        "use strict";

        // stop layouting, remove nodes and links
        this.force.stop();
        this.force.on("tick", undefined);
        this.force.on("end", undefined);

        this.force = undefined;
        this.zoom  = undefined;

        // _beforeSetState
        this.all_links    = undefined;
        this.links_map    = undefined;
        this.filterRelApplied = false;
        this.all_nodes    = undefined;
        this.nodes_map    = undefined;

        this.has_depth    = false;

        this.removed_nodes = undefined;

        // remove group objects that hold the visible elements
        // (the reverse of _initGroupObjects())
        this.links_group.remove();
        this.hulls_group.remove();
        this.surrounds_group.remove();
        this.clips_group.remove();
        this.text_group.remove();
        this.nodes_group.remove();
        this.manual_group_indicators_group.remove();

        // reset the selections (reverse of _updateSVGComponents())
        this.link_sel = undefined;
        this.hull_sel = undefined;
        this.clip_sel = undefined;
        this.surround_sel = undefined;
        this.node_sel = undefined;
        this.text_sel = undefined;
        this.manual_group_indicators_sel = undefined;

        // other attributes
        this.collection_members = {};
    },

    // Replace the current visualization state.
    //
    // This will re-construct all the visualization elements from scratch and
    // set the state to the specified one.
    //
    // Some of the current state is retained - the nodes' positions and "removed"
    // flag.
    //
    replaceVizState : function (data, callback) {
        "use strict";

        var objref            = this,
            removed_nodes     = this.removed_nodes,
            nodes_map         = this.nodes_map,
            removed_ids       = {},
            removed_seqs      = {},
            onReplaceCallback = bindContext(this, function () {
                // Highlight newly added nodes.
                if (this.highlightNode) {
                    this.node_sel
                        .filter(function (vd) { return !nodes_map[vd.id]; })
                        .each(function () {
                            objref.highlightNode(this, "new nodes added", true);
                        });
                }
                if (callback) {
                    callback();
                }
            });

        d3.keys(nodes_map)
            .concat(d3.keys(removed_nodes))
            .forEach(function (node_id) {
                var node = removed_nodes[node_id] || nodes_map[node_id];

                if (node.removed) {
                    removed_ids[node_id] = true;
                    removed_seqs[node_id] = node.removed_seq;

                    (node.members || []).forEach(function (member_id) {
                        var member_node = this.nodes_map[member_id];

                        if (member_node && !member_node.removed) {
                            // not a removed member
                            return;
                        }

                        removed_ids[member_id] = true;

                        if (member_node && member_node.removed_seq) {
                            // should have its own removed_seq
                            removed_seqs[member_id] = member_node.removed_seq;
                        }
                        else {
                            // inherit removed_seq from parent
                            removed_seqs[member_id] = node.removed_seq;
                        }
                    }, this);
                }
            }, this);

        this.reInit();

        // try restoring the positions for nodes, as well as their "removed"
        // states
        d3.keys(data.nodes).forEach(function (node_id) {
            var old_node = nodes_map[node_id] || removed_nodes[node_id],
                node     = data.nodes[node_id];

            if (removed_ids[node_id]) {
                node.removed = true;

                if (old_node) {
                    if (old_node.extra_data) {
                        node.removed_seq = old_node.extra_data.removed_seq ||
                                           removed_seqs[node_id];

                        if ( !(node.removed || node.hidden) ) {
                            node.x = old_node.extra_data.x;
                            node.y = old_node.extra_data.y;
                        }
                    }
                }
            }
        });

        if (this.app_mod_editor_mode && !this.app_start_modelling) {
            // have a saved model: restore model-specific state
            // (the ModelRulesEval API takes care of "remembering" relevant
            //  removed nodes)

            this.setVizState(data, onReplaceCallback);
        }
        else {
            // TODO problems in Bobblehat

            // TODO ideally re-evaluation for visualizations should behave the
            // same like re-evaluation for models (but because visualizations
            // have so many parameters there was no time to implement this
            // properly for Bobblehat)

            this._handleData(data, undefined, onReplaceCallback);
        }
    },

    // Store default visualization options such as:
    // - enabled state
    // - layout
    // - whether to show labels
    // - whether to show big or small vis (and position of it if it's small)
    //
    saveVizOptions : function () {
        "use strict";

        tw.xhr_client.jsonPostForm(this.options.ajax_url, {
            state: Object.toJSON({
                enabled          : this.enabled,
                show_big         : this.options.show_big,
                show_labels      : this.options.show_labels,
                layout           : this.options.layout,
                impact_direction : this.options.impact_direction,
                small_x          : this.options.small_x,
                small_y          : this.options.small_y,
                surround_type    : this.options.surround_type
            }),
            reqhash : this.options.nonce_token
        });
    },

    // Check if two given nodes are directly linked.
    //
    directlyLinked : function (a, b) {
        "use strict";

        var link = this.getLinkBetween(a, b);

        return link !== undefined && link.src_id !== link.tgt_id;
    },

    // Get a link between two given nodes if it exists, otherwise return undefined.
    //
    getLinkBetween : function (a, b) {
        "use strict";

        var link_prefix =
                this.isCollectionNode && (this.isCollectionNode(a) || this.isCollectionNode(b)) ?
                    this.LINK_COPY_PREFIX : "";

        return this.links_map[link_prefix + a.id + b.id] || this.links_map[link_prefix + b.id + a.id];
    },

    // Shows an ephemeral message about a node. If x/y location of the message container
    // is not given, the container will be shown next to the given node.
    //
    // datum   - Interested target node data,
    // target  - SVG element that represents the node data,
    // message - Message to be displayed,
    // x       - (Optional) X position of the message container,
    // y       - (Optional) Y position of the message container,
    // delay   - (Optional) How many milliseconds before the message disapper.
    //
    _showEphemeralMessageForNode: function (datum, target, message, x, y, delay) {
        "use strict";

        var bounding_rect_x = x || datum.node_icon_width / 2,
            bounding_rect_y = y || this.NODE_SIZE / 2 - 5,
            delay_ms = delay || 3500,
            eph_msg_x = bounding_rect_x + 2,
            eph_msg_y = bounding_rect_y + 18;

        var eph_msg_text = target.append("text")
            .attr("x", eph_msg_x)
            .attr("y", eph_msg_y)
            .attr("fill", "#313538")
            .attr("font-size", "12px")
            .attr("font-family", "'Salesforce Sans',Arial,sans-serif")
            .attr("text-anchor", "start")
            .style("cursor", "default")
            .text(message);

        var eph_msg_container = target.insert("rect", "text")
            .attr("x", bounding_rect_x)
            .attr("y", bounding_rect_y)
            .attr("width", Math.ceil(eph_msg_text.node().getBBox().width) + 5)
            .attr("height", "32")
            .attr("stroke", "#fff")
            .attr("stroke-width", "1px")
            .attr("fill", "#f1b521");

        [eph_msg_container, eph_msg_text].forEach(function (d3_elem) {
            d3_elem.on("click", function () {
                d3.event.stopPropagation();
            });
        });

        window.setTimeout(bindContext(this, function () {
            eph_msg_text.remove();
            eph_msg_container.remove();
        }), delay_ms);
    },

    // Build an ID for link.
    //
    // src_id : Source ID of the link,
    // tgt_id : Target ID of the link.
    //
    // Prefixes the ID with LINK_COPY_PREFIX if either end is a collection.
    //
    _buildLinkId : function (src_id, tgt_id) {
        "use strict";

        var link_id = src_id + tgt_id,
            source  = this.nodes_map[src_id] || this.removed_nodes[src_id],
            target  = this.nodes_map[tgt_id] || this.removed_nodes[tgt_id];

        if (this.isCollectionNode &&
                ((source && this.isCollectionNode(source)) ||
                 (target && this.isCollectionNode(target)))) {

            link_id = this.LINK_COPY_PREFIX + link_id;
        }

        return link_id;
    }
});


// Visualization displayed for CMDB Sync preview.
//
tw.viz.CMDBPreviewVisualization = tw.viz.Visualization.create(
    tw.viz.EventPumpMixIn,
    tw.viz.UndoMixIn,
    tw.viz.SelectionMixIn,
    tw.viz.SidebarMixIn,
{

    SHOW_HIDE_SECTION : "CIs",
    SHOW_HIDE_UNKNOWN : "External Cross-Reference",

    
    // Constructor
    //
    init : function (viz_name, node_id, datamodel, options, enabled) {
        "use strict";

        this.initEventPump();
        this.initUndo();

        this.datamodel = datamodel;

        this._super(viz_name, node_id, options, enabled);

        this.initSideBar();
    },

    addContextMenuItems : function () {
        "use strict";

        this._super();
        this.addSelectionContextMenuItems();
        this.addUndoContextMenuItems();
    },

    addSideBarMenuItems : function () {
        "use strict";

        this._super();
        this.addSelectionSideBarMenuItems();
    },

    nodeClick : function (d, node) {
        "use strict";

        this._super(d, node);
        this.nodeClickSelection(d, node);
    },

    _initControlObjects : function () {
        "use strict";

        this._super();
        this._initSelectionControlObjects();
    },

    _initGroupObjects : function () {
        "use strict";

        this._super();
        this._initSelectionGroupObjects();
    },

    // Request the initial data from the backend.
    //
    _requestInitialData : function () {
        "use strict";

        var objref = this;
        tw.xhr_client.jsonGet(this._buildRequestInitialDataUrl(),
            function (error, data) {
                if (!error) {
                    objref._handleData(data);
                }
            });
    },

    _buildManualGroupsSidebarSection : function () {
        "use strict";
        // This sidebar section is not valid for CMDB Sync Preview
    },

    _buildRequestInitialDataUrl : function () {
        "use strict";

        return (this.options.ajax_url + "?_tw_search_id=" + this.data_id +
                "&datamodel=" + encodeURIComponent(this.datamodel));
    },

    subscribeOnSignificantChanges : function() {
        "use strict";

        // CMDB Preview visualization does not have anything to save. So there is no significant
        // changes, and as a result should not happen any subscription
    }
});


// Visualization displayed on search pages.
//
tw.viz.SearchVisualization = tw.viz.Visualization.create(
    tw.viz.RulesMixIn,
    tw.viz.EventPumpMixIn,
    tw.viz.UndoMixIn,
    tw.viz.ExtendModelMixIn,
    tw.viz.SelectionMixIn,
    // tw.viz.NotesMixIn, - Disable notes functionality for Aardvark
    tw.viz.CollectionsMixIn,
    tw.viz.PreviewMixIn,
    tw.viz.HighlightMixIn,
    tw.viz.SidebarMixIn,
    tw.viz.SICreationMixIn,
    tw.viz.CSIExclusionMixIn,
    tw.viz.AppModellingMixin,
    // tw.viz.UserGroupingMixIn, - Disable user grouping for Aardvark
    tw.viz.SpinnerMixin,
{

    // Constructor
    //
    init : function (viz_name, data_id, options, enabled) {
        "use strict";

        this.initEventPump();
        this.initUndo();
        // this.initNotes(); - Disable notes functionality for Aardvark
        this.initHighlighting();
        // this.initUserGrouping(); - Disable user grouping for Aardvark

        this._super(viz_name, data_id, options, enabled);

        this.initRules();
        this.initSideBar();
        this.initExtendModelMixIn();

        // Updating the nonce token every 50 minutes
        // as the Ajax calls using internal REST API do not remove it
        setInterval(this._refreshToken, 3000000, this);
    },

    // Renew the security token
    // It should be done before the current one has expired
    _refreshToken : function(objref) {
        "use strict";

        tw.xhr_client.jsonRequest(
            objref.options.model_definitions_api_url +
                "?refresh_token=true&req_hash=" + objref.options.nonce_token,
            "POST",
            "{}",
            function (error, data) {
                if (error) {
                    return;
                }

                if (data && data.nonce_token) {

                    // Updating the token in the internal object
                    objref.options.nonce_token = data.nonce_token;
                }
            }
        );
    },

    // Compose URL for the _requestInitialData call.
    //
    _buildRequestInitialDataUrl : function () {
        "use strict";

        var url = this.options.ajax_url + "?_tw_search_id=" + this.data_id;
        if (this.options.context_id !== undefined) {
            url = url + "&context_id=" + this.options.context_id;
        }

        return url;
    },

    // Request the initial data from the backend.
    //
    _requestInitialData : function (callback) {
		"use strict";

		var objref = this,
			url    = this._buildRequestInitialDataUrl();

		//var json = "{\"servertime\":\"1583231597424\",\"nodes\":[{\"isServiceRequest\":\"false\",\"assetruleclassimage\":\"null_32_Error.svg\",\"uid\":\"CI_INST_2020_2_27_1_7_16_931013\",\"state\":\"C\",\"nodeUrl\":\"\",\"ciClassName\":\"BMC_BusinessService\",\"ciType\":\"BMC_BUSINESSSERVICE\",\"instType\":\"CI / Asset\",\"name\":\"End User Services\",\"image\":\"BMC_BusinessService_32_Error.svg\",\"type\":\"CI\",\"hoverText\":\" Class Name: BMC_BusinessService1s2a3m4i5r Description: IT Services available to all End Users1s2a3m4i5r Instance ID: INST_2020_2_27_1_7_16_9310131s2a3m4i5r\",\"id\":\"INST_2020_2_27_1_7_16_931013\",\"label\":\"IT Services available to all End Users\"},{\"isServiceRequest\":\"false\",\"assetruleclassimage\":\"null_32.svg\",\"uid\":\"CI_INST_2020_2_27_1_7_16_6801037\",\"state\":\"C\",\"nodeUrl\":\"\",\"ciClassName\":\"BMC_BusinessService\",\"ciType\":\"BMC_BUSINESSSERVICE\",\"instType\":\"CI / Asset\",\"name\":\"General End User Support\",\"image\":\"BMC_BusinessService_32.svg\",\"type\":\"CI\",\"hoverText\":\" Class Name: BMC_BusinessService1s2a3m4i5r Instance ID: INST_2020_2_27_1_7_16_68010371s2a3m4i5r\",\"id\":\"INST_2020_2_27_1_7_16_6801037\",\"label\":\"\"},{\"isServiceRequest\":\"false\",\"assetruleclassimage\":\"null_32.svg\",\"uid\":\"CI_INST_2020_2_27_1_7_16_6821044\",\"state\":\"C\",\"nodeUrl\":\"\",\"ciClassName\":\"BMC_BusinessService\",\"ciType\":\"BMC_BUSINESSSERVICE\",\"instType\":\"CI / Asset\",\"name\":\"User System Access\",\"image\":\"BMC_BusinessService_32.svg\",\"type\":\"CI\",\"hoverText\":\" Class Name: BMC_BusinessService1s2a3m4i5r Description: System Security and Access1s2a3m4i5r Instance ID: INST_2020_2_27_1_7_16_68210441s2a3m4i5r\",\"id\":\"INST_2020_2_27_1_7_16_6821044\",\"label\":\"System Security and Access\"},{\"isServiceRequest\":\"false\",\"assetruleclassimage\":\"null_32.svg\",\"uid\":\"CI_INST_2020_2_27_1_7_16_6831047\",\"state\":\"C\",\"nodeUrl\":\"\",\"ciClassName\":\"BMC_BusinessService\",\"ciType\":\"BMC_BUSINESSSERVICE\",\"instType\":\"CI / Asset\",\"name\":\"Security\",\"image\":\"BMC_BusinessService_32.svg\",\"type\":\"CI\",\"hoverText\":\" Class Name: BMC_BusinessService1s2a3m4i5r Description: Service for Security, Antivirus and Malware1s2a3m4i5r Instance ID: INST_2020_2_27_1_7_16_68310471s2a3m4i5r\",\"id\":\"INST_2020_2_27_1_7_16_6831047\",\"label\":\"Service for Security, Antivirus and Malware\"},{\"isServiceRequest\":\"false\",\"assetruleclassimage\":\"null_32.svg\",\"uid\":\"CI_INST_2020_2_27_1_7_16_6831048\",\"state\":\"C\",\"nodeUrl\":\"\",\"ciClassName\":\"BMC_BusinessService\",\"ciType\":\"BMC_BUSINESSSERVICE\",\"instType\":\"CI / Asset\",\"name\":\"SalesForce Enablement\",\"image\":\"BMC_BusinessService_32.svg\",\"type\":\"CI\",\"hoverText\":\" Class Name: BMC_BusinessService1s2a3m4i5r Description: Access to SalesForce.com to Sales1s2a3m4i5r Instance ID: INST_2020_2_27_1_7_16_68310481s2a3m4i5r\",\"id\":\"INST_2020_2_27_1_7_16_6831048\",\"label\":\"Access to SalesForce.com to Sales\"},{\"isServiceRequest\":\"false\",\"assetruleclassimage\":\"null_32_Error.svg\",\"uid\":\"CI_INST_2020_2_27_1_7_16_951019\",\"state\":\"C\",\"nodeUrl\":\"\",\"ciClassName\":\"BMC_BusinessService\",\"ciType\":\"BMC_BUSINESSSERVICE\",\"instType\":\"CI / Asset\",\"name\":\"Email and Messaging Services\",\"image\":\"BMC_BusinessService_32_Error.svg\",\"type\":\"CI\",\"hoverText\":\" Class Name: BMC_BusinessService1s2a3m4i5r Description: Corporate Email1s2a3m4i5r Instance ID: INST_2020_2_27_1_7_16_9510191s2a3m4i5r\",\"id\":\"INST_2020_2_27_1_7_16_951019\",\"label\":\"Corporate Email\"},{\"isServiceRequest\":\"false\",\"assetruleclassimage\":\"null_32.svg\",\"uid\":\"CI_INST_2020_2_27_1_7_16_951021\",\"state\":\"C\",\"nodeUrl\":\"\",\"ciClassName\":\"BMC_BusinessService\",\"ciType\":\"BMC_BUSINESSSERVICE\",\"instType\":\"CI / Asset\",\"name\":\"SAP Services\",\"image\":\"BMC_BusinessService_32.svg\",\"type\":\"CI\",\"hoverText\":\" Class Name: BMC_BusinessService1s2a3m4i5r Description: SAP Services1s2a3m4i5r Instance ID: INST_2020_2_27_1_7_16_9510211s2a3m4i5r\",\"id\":\"INST_2020_2_27_1_7_16_951021\",\"label\":\"SAP Services\"},{\"isServiceRequest\":\"false\",\"assetruleclassimage\":\"null_32.svg\",\"uid\":\"CI_INST_2020_2_27_1_7_16_6781030\",\"state\":\"C\",\"nodeUrl\":\"\",\"ciClassName\":\"BMC_BusinessService\",\"ciType\":\"BMC_BUSINESSSERVICE\",\"instType\":\"CI / Asset\",\"name\":\"Email Distribution List\",\"image\":\"BMC_BusinessService_32.svg\",\"type\":\"CI\",\"hoverText\":\" Class Name: BMC_BusinessService1s2a3m4i5r Instance ID: INST_2020_2_27_1_7_16_67810301s2a3m4i5r\",\"id\":\"INST_2020_2_27_1_7_16_6781030\",\"label\":\"\"},{\"isServiceRequest\":\"false\",\"assetruleclassimage\":\"null_32.svg\",\"uid\":\"CI_INST_2020_2_27_1_7_16_6841052\",\"state\":\"C\",\"nodeUrl\":\"\",\"ciClassName\":\"BMC_BusinessService\",\"ciType\":\"BMC_BUSINESSSERVICE\",\"instType\":\"CI / Asset\",\"name\":\"Increase Mailbox Storage\",\"image\":\"BMC_BusinessService_32.svg\",\"type\":\"CI\",\"hoverText\":\" Class Name: BMC_BusinessService1s2a3m4i5r Instance ID: INST_2020_2_27_1_7_16_68410521s2a3m4i5r\",\"id\":\"INST_2020_2_27_1_7_16_6841052\",\"label\":\"\"},{\"isServiceRequest\":\"false\",\"assetruleclassimage\":\"null_32.svg\",\"uid\":\"CI_INST_2020_2_27_1_7_16_6751022\",\"state\":\"C\",\"nodeUrl\":\"\",\"ciClassName\":\"BMC_BusinessService\",\"ciType\":\"BMC_BUSINESSSERVICE\",\"instType\":\"CI / Asset\",\"name\":\"SAP Human Capital Management\",\"image\":\"BMC_BusinessService_32.svg\",\"type\":\"CI\",\"hoverText\":\" Class Name: BMC_BusinessService1s2a3m4i5r Description: SAP Human Capital Management1s2a3m4i5r Instance ID: INST_2020_2_27_1_7_16_67510221s2a3m4i5r\",\"id\":\"INST_2020_2_27_1_7_16_6751022\",\"label\":\"SAP Human Capital Management\"},{\"isServiceRequest\":\"false\",\"assetruleclassimage\":\"null_32.svg\",\"uid\":\"CI_INST_2020_2_27_1_7_16_6761023\",\"state\":\"C\",\"nodeUrl\":\"\",\"ciClassName\":\"BMC_BusinessService\",\"ciType\":\"BMC_BUSINESSSERVICE\",\"instType\":\"CI / Asset\",\"name\":\"SAP Supply Change Management\",\"image\":\"BMC_BusinessService_32.svg\",\"type\":\"CI\",\"hoverText\":\" Class Name: BMC_BusinessService1s2a3m4i5r Description: SAP Supply Change Management1s2a3m4i5r Instance ID: INST_2020_2_27_1_7_16_67610231s2a3m4i5r\",\"id\":\"INST_2020_2_27_1_7_16_6761023\",\"label\":\"SAP Supply Change Management\"},{\"isServiceRequest\":\"false\",\"assetruleclassimage\":\"null_32.svg\",\"uid\":\"CI_INST_2020_2_27_1_7_16_6761024\",\"state\":\"C\",\"nodeUrl\":\"\",\"ciClassName\":\"BMC_BusinessService\",\"ciType\":\"BMC_BUSINESSSERVICE\",\"instType\":\"CI / Asset\",\"name\":\"SAP Procurement\",\"image\":\"BMC_BusinessService_32.svg\",\"type\":\"CI\",\"hoverText\":\" Class Name: BMC_BusinessService1s2a3m4i5r Description: SAP Procurement1s2a3m4i5r Instance ID: INST_2020_2_27_1_7_16_67610241s2a3m4i5r\",\"id\":\"INST_2020_2_27_1_7_16_6761024\",\"label\":\"SAP Procurement\"},{\"isServiceRequest\":\"false\",\"assetruleclassimage\":\"null_32_Error.svg\",\"uid\":\"CI_INST_2020_2_27_1_7_16_941016\",\"state\":\"C\",\"nodeUrl\":\"\",\"ciClassName\":\"BMC_BusinessService\",\"ciType\":\"BMC_BUSINESSSERVICE\",\"instType\":\"CI / Asset\",\"name\":\"MS Exchange San Jose\",\"image\":\"BMC_BusinessService_32_Error.svg\",\"type\":\"CI\",\"hoverText\":\" Class Name: BMC_BusinessService1s2a3m4i5r Description: San Jose Mail Service1s2a3m4i5r Instance ID: INST_2020_2_27_1_7_16_9410161s2a3m4i5r\",\"id\":\"INST_2020_2_27_1_7_16_941016\",\"label\":\"San Jose Mail Service\"},{\"isServiceRequest\":\"false\",\"assetruleclassimage\":\"null_32.svg\",\"uid\":\"CI_INST_2020_2_27_1_7_16_941017\",\"state\":\"C\",\"nodeUrl\":\"\",\"ciClassName\":\"BMC_BusinessService\",\"ciType\":\"BMC_BUSINESSSERVICE\",\"instType\":\"CI / Asset\",\"name\":\"MS Exchange Houston\",\"image\":\"BMC_BusinessService_32.svg\",\"type\":\"CI\",\"hoverText\":\" Class Name: BMC_BusinessService1s2a3m4i5r Description: Houston Mail Service1s2a3m4i5r Instance ID: INST_2020_2_27_1_7_16_9410171s2a3m4i5r\",\"id\":\"INST_2020_2_27_1_7_16_941017\",\"label\":\"Houston Mail Service\"}],\"edges\":[{\"relationType\":\"Service-Subservice\",\"relationName\":\"End User Services - General End User Support\",\"arrowStyle\":\"LeftToRight\",\"fillColor\":\"000000\",\"type\":\"Solid\",\"lineWeight\":\"1\",\"rightNodeId\":\"CI_INST_2020_2_27_1_7_16_6801037\",\"leftNodeId\":\"CI_INST_2020_2_27_1_7_16_931013\"},{\"relationType\":\"Service-Subservice\",\"relationName\":\"End User Services - User System Access\",\"arrowStyle\":\"LeftToRight\",\"fillColor\":\"000000\",\"type\":\"Solid\",\"lineWeight\":\"1\",\"rightNodeId\":\"CI_INST_2020_2_27_1_7_16_6821044\",\"leftNodeId\":\"CI_INST_2020_2_27_1_7_16_931013\"},{\"relationType\":\"Service-Subservice\",\"relationName\":\"End User Services - Security\",\"arrowStyle\":\"LeftToRight\",\"fillColor\":\"000000\",\"type\":\"Solid\",\"lineWeight\":\"1\",\"rightNodeId\":\"CI_INST_2020_2_27_1_7_16_6831047\",\"leftNodeId\":\"CI_INST_2020_2_27_1_7_16_931013\"},{\"relationType\":\"Service-Subservice\",\"relationName\":\"End User Services - SalesForce Enablement\",\"arrowStyle\":\"LeftToRight\",\"fillColor\":\"000000\",\"type\":\"Solid\",\"lineWeight\":\"1\",\"rightNodeId\":\"CI_INST_2020_2_27_1_7_16_6831048\",\"leftNodeId\":\"CI_INST_2020_2_27_1_7_16_931013\"},{\"relationType\":\"Service-Subservice\",\"relationName\":\"End User Services - Email\",\"arrowStyle\":\"LeftToRight\",\"fillColor\":\"000000\",\"type\":\"Solid\",\"lineWeight\":\"1\",\"rightNodeId\":\"CI_INST_2020_2_27_1_7_16_951019\",\"leftNodeId\":\"CI_INST_2020_2_27_1_7_16_931013\"},{\"relationType\":\"Destination-Source\",\"relationName\":\"SAP Services - End User Services\",\"arrowStyle\":\"RightToLeft\",\"fillColor\":\"FF652424\",\"type\":\"Dotted\",\"lineWeight\":\"1\",\"rightNodeId\":\"CI_INST_2020_2_27_1_7_16_951021\",\"leftNodeId\":\"CI_INST_2020_2_27_1_7_16_931013\"},{\"relationType\":\"Service-Subservice\",\"relationName\":\"Email and Messaging Services - Email Distribution List\",\"arrowStyle\":\"LeftToRight\",\"fillColor\":\"000000\",\"type\":\"Solid\",\"lineWeight\":\"1\",\"rightNodeId\":\"CI_INST_2020_2_27_1_7_16_6781030\",\"leftNodeId\":\"CI_INST_2020_2_27_1_7_16_951019\"},{\"relationType\":\"Service-Subservice\",\"relationName\":\"Email and Messaging Services - Increase Mailbox Storage\",\"arrowStyle\":\"LeftToRight\",\"fillColor\":\"000000\",\"type\":\"Solid\",\"lineWeight\":\"1\",\"rightNodeId\":\"CI_INST_2020_2_27_1_7_16_6841052\",\"leftNodeId\":\"CI_INST_2020_2_27_1_7_16_951019\"},{\"relationType\":\"Service-Subservice\",\"relationName\":\"SAP Services - SAP Human Capital Management\",\"arrowStyle\":\"LeftToRight\",\"fillColor\":\"000000\",\"type\":\"Solid\",\"lineWeight\":\"1\",\"rightNodeId\":\"CI_INST_2020_2_27_1_7_16_6751022\",\"leftNodeId\":\"CI_INST_2020_2_27_1_7_16_951021\"},{\"relationType\":\"Service-Subservice\",\"relationName\":\"SAP Services - SAP Supply Change Management\",\"arrowStyle\":\"LeftToRight\",\"fillColor\":\"000000\",\"type\":\"Solid\",\"lineWeight\":\"1\",\"rightNodeId\":\"CI_INST_2020_2_27_1_7_16_6761023\",\"leftNodeId\":\"CI_INST_2020_2_27_1_7_16_951021\"},{\"relationType\":\"Service-Subservice\",\"relationName\":\"SAP Services - SAP Procurement\",\"arrowStyle\":\"LeftToRight\",\"fillColor\":\"000000\",\"type\":\"Solid\",\"lineWeight\":\"1\",\"rightNodeId\":\"CI_INST_2020_2_27_1_7_16_6761024\",\"leftNodeId\":\"CI_INST_2020_2_27_1_7_16_951021\"},{\"relationType\":\"Source-Destination\",\"relationName\":\"MS Exchange San Jose - Email\",\"arrowStyle\":\"LeftToRight\",\"fillColor\":\"000000\",\"type\":\"Solid\",\"lineWeight\":\"1\",\"rightNodeId\":\"CI_INST_2020_2_27_1_7_16_951019\",\"leftNodeId\":\"CI_INST_2020_2_27_1_7_16_941016\"},{\"relationType\":\"Source-Destination\",\"relationName\":\"MS Exchange Houston - Email\",\"arrowStyle\":\"LeftToRight\",\"fillColor\":\"000000\",\"type\":\"Solid\",\"lineWeight\":\"1\",\"rightNodeId\":\"CI_INST_2020_2_27_1_7_16_951019\",\"leftNodeId\":\"CI_INST_2020_2_27_1_7_16_941017\"}]}",
		var local_data = JSON.parse(launchAttributesCI);
		//console.log(local_data);
		objref._handleData(convertGraphData(local_data));
		
	},

    _defineMarkers : function () {
        "use strict";

        this._super();

        // define app-modelling specific SVG shapes
        this._defineMarkersAppModelling();
    },

    _updateAddedNodes : function (node_add, initial) {
        "use strict";

        var objref = this;

        this._super();

        // highlight nodes needing attention
        if (this.highlightReviewSuggestedNode !== undefined) {
            node_add.each(function (datum) {
                if (datum.review_suggested) {
                    objref.highlightReviewSuggestedNode(this, true);
                }
            });
        }

        // construct "review suggested" indicators for nodes
        if (this._constructReviewSuggestedIndicator !== undefined) {
            node_add.each(function (datum) {
                if (datum.review_suggested) {
                    var g = d3.select(this);

                    objref._constructReviewSuggestedIndicator(g, datum);
                }
            });
        }
    },

    _constructElements : function () {
        "use strict";

        this._super();
        // this._constructNotesElements(); - Disable notes functionality for Aardvark
        this._constructSICreationModalDialog();
        this._constructCSIExclusionModalDialog();
        this._constructUndoRedoButtons();
    },

    addContextMenuItems : function () {
        "use strict";

        this._super();
        this.addExtendModelMenuItems();
        this.addSelectionContextMenuItems();
        this.addSharedNodesContextMenuItems();
        this.addRulesContextMenuItems();
        this.addUndoContextMenuItems();
        this.addCollectionsContextMenuItems();
        this.addPreviewContextMenuItems();
        this.addHighlightingContextMenuItems();
        // this.addNotesContextMenuItems(); - Disable notes functionality for Aardvark
        this.addSICreationContextMenuItem();
        this.addCSIExclusionContextMenuItem();
        this.addAppModellingContextMenuItems();
        // this.addUserGroupingContextMenuItems(); - Disable user grouping for Aardvark
        this.addAutoGroupingContextMenuItems();
    },

    addAutoGroupingContextMenuItems : function() {
        "use strict";

        this.CONTEXT_MENU_ITEMS["node"] =
            this.CONTEXT_MENU_ITEMS["node"].concat([
            [
                bindContext(this, function (datum, target) {
                    if (this.root_kind === "AutomaticGroup" &&
                        datum.kind === "Host") {
                        if (datum.excluded_from_grouping) {
                            return "Include in Automatic Grouping";
                        }
                        else {
                            return "Exclude from Automatic Grouping";
                        }
                    }
                    else {
                        return undefined;
                    }
                }),
                true,
                bindContext(this, this._handleExclusion)
            ]
        ]);
    },

    _handleExclusion : function(d, element, top_position, scaled_position) {
        "use strict";

        // Make call to the back end
        tw.xhr_client.jsonRequest(
            this.options.node_operations_api_url + "/" + d.id + "/" +
                (d.excluded_from_grouping ?
                    "include_in_grouping" : "exclude_from_grouping") +
                "?req_hash=" + this.options.node_operations_nonce_token,
            "PUT",
            "{}",
            // bind datum "d" as "this"
            bindContext(d, function (error, data) {
                if (!error) {
                    // Toggle flag
                    if (this.excluded_from_grouping) {
                        this.excluded_from_grouping = false;
                    }
                    else {
                        this.excluded_from_grouping = true;
                    }
                }
            })
        );
    },

    addSideBarMenuItems : function () {
        "use strict";

        this._super();
        this.addSelectionSideBarMenuItems();
        // this.addAppModellingInlineVizSideBarMenuItems();
    },

    _getContextMenuSelection : function (datum) {
        "use strict";

        var sel = this._super(datum);

        // if (sel.target_kind === undefined || sel.items === undefined) { - Disable notes functionality for Aardvark
        //    sel = this._getNotesContextMenuSelection(datum);
        // }

        return sel;
    },

    nodeClick : function (d, node) {
        "use strict";

        this._super(d, node);
        this.nodeClickSelection(d, node);
    },

    _addHeaderButtons : function (header) {
        "use strict";

        // Let the superclass construct the buttons
        var buttons = this._super(header);

        // Add a close button at the end
        /*if (this.options.can_close) {
          buttons
            .append("button")
            .attr("title", "Close")
            .attr("type", "button")
            .on("click", bindContext(this, this.toggleVisualization))
            .append("img")
            .attr("alt", "Close")
            .attr("src", this.options.images.x_normal)
            .attr("onmouseout", "this.src='" + this.options.images.x_normal + "';")
            .attr("onmouseover", "this.src='" + this.options.images.x_hot + "';");
        }*/
            
		/*buttons
            .append("button").text(labels.AnalyzeImpact)
            .attr("title", labels.AnalyzeImpact)
            .attr("type", "button")
			.attr("class", "analyze-impact-btn analyze-impact-btn-disabled")
			.attr("id", "analyze-impact-btn")
			.attr("disabled", true)
            .on("click", bindContext(this, this.analyzeImpact));*/
		buttons
            .append("button").text('?')
            .attr("type", "button")
			.attr("class", "help-btn")
            .on("click", bindContext(this, this.openWiki));
    },

    _initControlObjects : function () {
        "use strict";

        this._super();
        this._initSelectionControlObjects();
        // this._initNotesControlObjects(); - Disable notes functionality for Aardvark
    },

    _initGroupObjects : function () {
        "use strict";

        this._super();
        this._initSelectionGroupObjects();
        // this._initNotesGroupObjects(); - Disable notes functionality for Aardvark
    },

    _updateSVGComponents : function (initial, ender) {
        "use strict";

        this._super();

        if (ender) {
            // Sticky notes

            // this.updateNotes(initial, ender); - Disable notes functionality for Aardvark
        }
    },

    _setTransformAttr : function () {
        "use strict";

        this._super();
        // this._setNotesTransformAttr(); - Disable notes functionality for Aardvark
    },

    layoutTransition : function (do_zoom, callback) {
        "use strict";

        var ender = this._super(do_zoom, callback);
        // this.layoutTransitionNotes(do_zoom, callback, ender); - Disable notes functionality for Aardvark
    },

    // User-made collections awareness
    // ===============================

    expandCollection : function (d, callback, push_event) {
        "use strict";

        tw.viz.CollectionsMixIn.prototype.expandCollection.call(
            this, d, callback, push_event
        );

        // - Disable user grouping for Aardvark

        //if (d.collection_type === this.COLLECTION_TYPE_USER) {
        //    // make user-made collection specific expansion
        //    this.expandUserCollection(d, callback);
        //}
        //else {
        //    // system-made collection, call ordinary expand function
        //    tw.viz.CollectionsMixIn.prototype.expandCollection.call(
        //        this, d, callback
        //    );
        //}
    },

    loadMembers : function (d, callback) {
        "use strict";

        tw.viz.PreviewMixIn.prototype.loadMembers.call(this, d, callback);

        // - Disable user grouping for Aardvark

        //if (d.collection_type === this.COLLECTION_TYPE_USER) {
        //    // user-made collection - load might be synchronous or asynchronous
        //    // if there's missing data for some nodes
        //    this.loadUserCollectionMembers(d, callback);
        //}
        //else {
        //    // system-made collection
        //    tw.viz.PreviewMixIn.prototype.loadMembers.call(this, d, callback);
        //}
    },

    // State persistence
    // =================

    getVizState : function () {
        "use strict";

        var state = this._super();

        this.addCollectionsVizState(state);
        // this.addNotesVizState(state); - Disable notes functionality for Aardvark

        return state;
    },

    setVizState : function (data) {
        "use strict";

        // nodes and collections are handled by _setVizStateForNode
        data.nodes = mergeObjects(data.nodes, data.collections || {});

        this._super(data);

        // this.setNotesVizState(data); - Disable notes functionality for Aardvark

        this.app_name = data.name;
        this.app_description = data.description;

        // Post-process nodes state
        // - recalculate all collection members - ensure data consistency
        // - propagate "review suggested" from collections to members
        //   and vice versa
        this.all_nodes.forEach(function (node) {
            if (this.isCollectionNode(node)) {
                this._recalculateCollectionMembers(node);
            }

            else if (this.isCollectionMember(node)) {
                var collection = this.nodes_map[node.collection];

                // If one of the members of a collapsed collection needs
                // attention, then the whole collection needs attention.
                if (node.review_suggested && !collection.review_suggested &&
                        !collection.expanded) {
                    collection.review_suggested = true;
                }
            }
        }, this);
    },

    _getVizStateForNode : function (n, state) {
        "use strict";

        var ordinary_state = this._super(n, state) &&
                             this._getSelectionVizStateForNode(n, state);

        if (this.isCollectionNode(n)) {
            // Collection nodes (and their collapsed members) are handled
            // separately, by addCollectionsVizState.
            //
            // We update per-node state object, but return false to indicate a
            // collection node should not be included along ordinary nodes.
            return false;
        }

        // Add collection-aware state for ordinary nodes
        // & members of expanded collections

        return ordinary_state && this._getVizStateForExpandedMember(n, state);
    },

    _setVizStateForNode : function (n, state, data) {
        "use strict";

        var ret = this._super(n, state);

        if (!ret) {
            return false;
        }

        n.collection = state.collection;

        if (this.isCollectionNode(state)) {
            n.members                 = state.members;
            n.members_short_name      = state.members_short_name;
            n.members_shared          = state.members_shared;
            n.members_not_shared      = state.members_not_shared;
            n.members_shared_override = state.members_shared_override;

            n.member_kinds            = state.member_kinds;

            n.collection_type         = state.collection_type;
            n.collection_name         = state.collection_name;

            n.expanded                = state.expanded;
            n.expandable              = state.expandable;
            n.removed                 = state.removed;
        }

        return ret;
    },

    // Function that contains changes for page layout, based on presence of "Save changes"
    // button on a screen.
    //
    updateLayoutForSaveChangesButton : function() {
        "use strict";

        d3.select("#querybuilder")
            .style({ "margin-bottom" : (this.getPendingRules().length ||
                                        this.getPendingSharedOverrides().length) ? "38px"
                                                                                 : null });
    }
});


// Visualization displayed on node view pages.
//
tw.viz.NodeViewVisualization = tw.viz.SearchVisualization.create({

    init : function (viz_name, data_id, options, enabled) {
        "use strict";

        this._super(viz_name, data_id, options, enabled);

        // If the visualization can be closed we need to update the button

        if (this.options.can_close) {
            var label = enabled ? "Hide Visualization" : (options.button_label || viz_name),
                title = enabled ? "Hide current visualization" : "Show current visualization";

            d3.select("input[id=showInlineVizButton]")
                .attr("value", label)
                .attr("title", title)
                .attr("disabled", null)
                .on("click", bindContext(this, this.toggleVisualization));
        }
        else {
            // Visualization can't be closed, so remove the button
            d3.select("input[id=showInlineVizButton]")
                .remove();
        }
    },

    // General function that show/hides visualization on screen
    //
    toggleVisualization: function() {
        "use strict";

        var show_hide_viz_button = d3.select("input[id=showInlineVizButton]");

        if (this.enabled) {
            // Hide visualization
            this.enabled = false;
            this.closeKey();
            this.in_div.style({ display: "none" });
            this.saveVizOptions();

            show_hide_viz_button.attr("value", this.options.button_label || this.viz_name)
                .attr("title", "Show current visualization");

            if (this.save_changes_button) {
                this.save_changes_button.style({ display: "none" });
            }
        }
        else {
            // Show visualization
            this.enabled = true;

            if (this.in_div) {
                // Already constructed
                this.in_div.style({ display: "block" });
                this.in_div.style(this._inDivStyle());
                this.saveVizOptions();
                this.zoomToFit();
            }
            else {
                this.construct();
                this.start();
                this.saveVizOptions();
            }

            show_hide_viz_button.attr("value", "Hide Visualization")
                .attr("title", "Hide current visualization");

            if (this.save_changes_button) {
                this.updateSaveChangesButton();
            }
        }
    },

    // Compose URL for the _requestInitialData call.
    //
    _buildRequestInitialDataUrl : function () {
        "use strict";

        var url = this.options.ajax_url + "?id=" + this.data_id;
        if (this.options.context_id !== undefined) {
            url = url + "&context_id=" + this.options.context_id;
        }

        if (this.options.grouping_params) {
            url = url + "&grouping=" + this.options.grouping_params;
        }

        return url;
    }
});

// The application modelling editor visualization.
//
// Note: the NodeVisualization covers most of its functionality, since
//       it can "transform" into an editor dynamically. This class
//       should only include customizations related to getting the initial data.
//
tw.viz.AppModellingVisualization = tw.viz.NodeViewVisualization.create({

    init : function (app_name, app_properties, node_id, clone_id, source_id, app_id, viewing_bai, published, options, enabled) {
        "use strict";

        var merged_options = mergeObjects(
            options,
            {
                enable_editing  : enabled,
                highlight_root  : false,
                button_label    : "Visualize",
                load_rules      : true
            }
        );

        // Ensure that in edit mode we always show the
        // visualization maximised.

        if (!merged_options.view_mode) {
            merged_options.show_big = true;
        }

        if (merged_options.context_id === undefined) {
            // default context is Software - switch to it if no explicit
            // context_id is specified
            merged_options.context_id = 0;
        }

        // Variables used by the mixin

        this.app_name        = app_name;
        this.app_properties  = app_properties;
        this.app_clone_id    = clone_id;
        this.app_source_id   = source_id;
        this.app_bai_id      = app_id;
        this.app_published   = published;

        // Variables used only by this class

        this.app_viewing_bai = viewing_bai;

        this._super(app_name, node_id, merged_options, enabled);
    },

    addSideBarMenuItems : function () {
        "use strict";

        this._super();
        this.addAppModellingEditorSideBarMenuItems();
    },

    addAppModellingInlineVizSideBarMenuItems : function () {
        "use strict";

        // Sidebar items specific for the Inline Visualization
        // are not available in the App Modelling Editor unless
        // we are viewing a BAI.

        if (this.app_viewing_bai) {
            this._super();
        }
    },

    saveVizOptions : function () {
        "use strict";

        // In application models, we only remember the surround type
        // as the user changes the options. Layout is persisted along
        // with the model state upon explicit save.

        tw.xhr_client.jsonPostForm(this.options.ajax_url, {
            state: Object.toJSON({
                surround_type : this.options.surround_type}),
            reqhash: this.options.nonce_token
        });
    },

    _showExportSidebar : function (sidebar_div) {
        "use strict";

        this._super(sidebar_div);
        this._showAppModellingExportSidebar(sidebar_div);
    },

    _buildRequestInitialDataUrl : function () {
        "use strict";

        return this.options.model_definitions_api_url + "/" + this.data_id +
               "?req_hash=" + this.options.nonce_token;
    },

    _requestInitialData : function () {
        "use strict";

        var objref = this;

        if (!objref.options.view_mode) {
            objref.editMode();
        }
        else {
            objref.viewMode();
        }

        tw.xhr_client.jsonGet(
            this._buildRequestInitialDataUrl(),
            function (error, data) {
                if (error) {
                    return;
                }

                var has_collections    = objref.isCollectionNode !== undefined,
                    visible_node_count = d3.values(data.nodes).filter(function (node) {
                        var visible       = !node.removed,
                            is_col_member = has_collections && objref.isCollectionMember(node),
                            is_col_node   = has_collections && objref.isCollectionNode(node);

                        if (is_col_member) {
                            var collection = data.nodes[node.collection];
                            if (collection) {
                                visible = visible && collection.expanded;
                            }
                        }

                        if (is_col_node) {
                            visible = visible && !node.expanded;
                        }

                        return visible;
                }).length;

                var max_nodes_per_model = objref.options.max_nodes_per_model,
                    proceed_func = bindContext(objref, function () {
                        objref.setVizState(data);
                        objref.markAllCollectionsMembersLoaded();
                    });

                if (max_nodes_per_model > 0 && visible_node_count > max_nodes_per_model) {

                    // Handlers for buttons in the dialog
                    var yes_btn_handler = bindContext(objref, function() {
                            proceed_func.call(objref);
                        }),
                        no_btn_handler = bindContext(objref, function() {
                            // Remove the visualization container from page
                            objref.in_div.remove();

                            // Delete the reference to D3 element which is already removed from the page
                            delete objref.in_div;

                            // If the current page is an Application Model in Edit mode, saying
                            // NO should behave exactly as clicking "Stop Editing" button
                            if (objref.app_mod_editor_mode) {
                                window.setTimeout(bindContext(objref, function(){
                                    objref.stopEditing();
                                }), 10);
                            }
                        });

                    // Show the dialog to ask if user wants to render the graph with many nodes
                    showConfirmDialog(
                        "Large Number of Nodes",
                        "There are " + visible_node_count + " nodes to render in this application model, " +
                        "which may take a long time to display. Would you like to continue anyway?",
                        yes_btn_handler, no_btn_handler);
                }
                else {
                    proceed_func.call(objref);
                }
            }
        );
    }

});

tw.viz.StaticVisualization = tw.viz.Visualization.create(
    tw.viz.CollectionsMixIn,
    tw.viz.RulesMixIn,
{

    init : function (data_id, context_id) {
        "use strict";

        var options = {
            show_big          : true,
            show_labels       : true,
            dynamic           : false,
            nodes_clickable   : false,
            context_id        : context_id,
            load_rules        : false
        };

        // PhantomJS doesn't cope well with exceptions
        try {
            this._super("Static Visualization", data_id, options, true);
        }
        catch (e) {
            console.log("Error while initializing static visualization: ", e);
        }
    },

    construct : function() {
        "use strict";
        this.div_class = this.BIG_DIV_CLASS;

        this.in_div = this.top_div.append("div")
            .attr("class", this.div_class)
            .attr("id", "InlineVisualizationInner");

        this.viz_container = this.in_div
            .append("div")
            .attr("class", "softwareContextVizContainer");
    },

    showContextMenu : function () {
        // Do not show a custom context menu.
    },

    setBig : function() {
        "use strict";

        this.w_scale = this.BIG_W_SCALE;
        this.h_scale = this.BIG_H_SCALE;

        this.in_div
            .attr("class", this.BIG_DIV_CLASS)
            .attr("style", "");
    },

    // Compose URL for the _requestInitialData call.
    //
    _buildRequestInitialDataUrl : function () {
        "use strict";

        return this.options.ajax_url + "?id=" + this.data_id +
                     "&context_id=" + this.options.context_id;
    },

    // Request the initial data from the backend.
    //
    _requestInitialData : function (callback) {
        "use strict";

        var objref = this,
            url    = this._buildRequestInitialDataUrl();

        tw.xhr_client.jsonGet(url, function (error, data) {
            if (error) {
                return;
            }

            if (callback) {
                callback(data);
            }
            else {
                objref._handleData(data);
            }
        });
    }
});
