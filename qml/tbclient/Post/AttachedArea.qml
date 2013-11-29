import QtQuick 1.1
import com.nokia.symbian 1.1

Item {
    id: root;
    
    property alias imageList: imageArea.imageList;
    
    anchors.bottom: parent.bottom;
    width: screen.width;
    height: screen.height < 480 ? 120 : 200;
    
    ImageArea {
        id: imageArea;
        y: root.height;
        opacity: 0;
    }

    VoiceArea {
        id: voiceArea;
        y: root.height;
        opacity: 0;
    }
    
    states: [
        State {
            name: "Image";
            PropertyChanges { target: app; showToolBar: false; }
            PropertyChanges { target: imageArea; y: 0; opacity: 1; }
        },
        State {
            name: "Voice";
            PropertyChanges { target: app; showToolBar: false; }
            PropertyChanges { target: voiceArea; y: 0; opacity: 1; }
        }
    ]
    
    transitions: [
        Transition {
            PropertyAnimation { properties: "y,opacity"; }
        }
    ]
}
