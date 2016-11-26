/**
 * @author Santhosh Vasabhaktula <santhosh@ilimi.in>
 */
EkstepEditor.basePlugin.extend({
    type: "stage",
    thumbnail: undefined,
    onclick: undefined,
    currentObject: undefined,
    canvas: undefined,
    initialize: function() {
        EkstepEditorAPI.addEventListener("stage:create", this.createStage, this);
        EkstepEditorAPI.addEventListener("object:modified", this.modified, this);
        EkstepEditorAPI.addEventListener("object:selected", this.objectSelected, this);
        EkstepEditorAPI.addEventListener("object:removed", this.objectRemoved, this);
    },
    createStage: function(event, data) {
        EkstepEditorAPI.instantiatePlugin(this.manifest.id, {});
    },
    newInstance: function(data) {
        this.onclick = { id: 'stage:select', data: { stageId: this.id } }
        EkstepEditorAPI.addStage(this);
        this.attributes = {
            x: 0,
            y: 0,
            w: 720,
            h: 405,
            id: this.id
        };
    },
    setCanvas: function(canvas) {
        this.canvas = canvas;
    },
    addChild: function(plugin) {
        this.children.push(plugin);
        this.canvas.add(plugin.editorObj);
        this.canvas.setActiveObject(plugin.editorObj);
        this.canvas.trigger('object:selected', { target: plugin.editorObj });
        this.setThumbnail();
        EkstepEditorAPI.dispatchEvent('object:modified', { id: plugin.id });
    },
    setThumbnail: function() {
        this.thumbnail = this.canvas.toDataURL('png');
    },
    updateZIndex: function() {
        var instance = this;
        _.forEach(this.children, function(child) {
            if(child.editorObj) {
                child.attributes['z-index'] = instance.canvas.getObjects().indexOf(child.editorObj);
            } else {
                child.attributes['z-index'] = instance.canvas.getObjects().length;
            }
        });
    },
    render: function(canvas) {
        _.forEach(_.sortBy(this.children, [function(o) { return o.getAttribute('z-index'); }]), function(plugin) {
            plugin.render(canvas);
        });
        canvas.renderAll();
        this.thumbnail = canvas.toDataURL('png');
        EkstepEditorAPI.refreshStages();
    },
    modified: function(event, data) {
        EkstepEditorAPI.getCurrentStage().updateZIndex();
        EkstepEditorAPI.getCurrentStage().setThumbnail();
        EkstepEditorAPI.refreshStages();
    },
    objectSelected: function(event, data) {
        if(!_.isUndefined(this.currentObject) && this.currentObject !== data.id) {
            var plugin = EkstepEditorAPI.getPluginInstance(this.currentObject);
            EkstepEditorAPI.getCanvas().trigger("selection:cleared", { target: plugin.editorObj });
        }
        this.currentObject = data.id;
    },
    objectRemoved: function(event, data) {
        this.currentObject = undefined;
    },
    destroyOnLoad: function(childCount, canvas, cb) {
        var instance = this;
        if(childCount == instance.children.length) {
            canvas.clear();
            instance.render(canvas);
            $('#' + instance.id).remove();
            cb();
        } else {
            setTimeout(function() {
                instance.destroyOnLoad(childCount, canvas, cb);
            }, 1000);
        }
    }
});
//# sourceURL=stageplugin.js