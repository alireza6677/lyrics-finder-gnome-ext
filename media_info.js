const Me = imports.misc.extensionUtils.getCurrentExtension();
const DBusIface = Me.imports.dbus;

var MediaInfo = class Media_Info {

    constructor(busName, owner, callback) {
        this.owner = owner;

        new DBusIface.Properties(busName,
            (proxy) => {
                this._prop = proxy;
                this._ready();
            });

        new DBusIface.MediaServer2Player(busName,
            (proxy) => {
                this._mediaServerPlayer = proxy;
                this._server_ready();
            });

        this._callback = callback;
    }

    _ready() {
        this._propChangedId = this._prop.connectSignal('PropertiesChanged',
            (proxy, sender, [iface, props]) => {
                if (!props.Metadata)
                    return;
                this.parse_data(props.Metadata.deep_unpack());
        });
    }

    _server_ready(){
        this.parse_data(this._mediaServerPlayer.Metadata);
    }

    parse_data(metadata) {
        if (!metadata || Object.keys(metadata).length < 2) {
            metadata = {};
        }

        const title = metadata["xesam:title"] ? metadata["xesam:title"].unpack() : "";

        let artist = metadata["xesam:artist"] ? metadata["xesam:artist"].deep_unpack().toString() : "";
        artist = metadata["rhythmbox:streamTitle"] ? metadata["rhythmbox:streamTitle"].unpack() : artist;
        if (title.trim().length == 0){
            this._callback(null, null);
            return;
        }
        this._callback(title, artist);
    }

    disconnect() {
        this._prop.disconnectSignal(this._propChangedId);
        this._callback(null, null);
    }
}
