import React, { Component } from 'react';
import './style/App.scss';
import { connect } from "react-redux";
import { changeView } from "./actions/index";
class App extends Component {
  constructor(){
    super()

    window.onReceivedSharedFiles = () => {}
    this.state = {
      contacts:[]
    }
  }

  readBattery ()
  {
    if (navigator.getBattery)
    {
      navigator.getBattery().then((battery) => {
        //console.log('battery',battery)
        this.setState({batteryLevel:battery.level})
      })
    }
    else
    {
      this.setState({batteryLevel:'NOT_SUPPORTED'})
    }
  }

  readClipBoard ()
  {
    if (navigator.clipboard)
    {
      navigator.clipboard.readText().then((text) => {
        this.setState({clipboardRead:text})
      })
    }
    else
    {
      this.setState({clipboardRead:'NOT_SUPPORTED'})
    }
  }

  writeClipBoard ()
  {
    if (navigator.clipboard)
    {
      navigator.clipboard.writeText(document.querySelector('#clipboardWriteInp').value).then((text) => {

      })
    }
    else
    {
      this.setState({clipboardWrite:'NOT_SUPPORTED'})
    }
  }

  getPosition ()
  {
    if (navigator.geolocation && navigator.geolocation.getCurrentPosition)
    {
      this.setState({position:'Loading...'});
      navigator.geolocation.getCurrentPosition((position) => {
        if (position)
        {
          //console.log('position',position.coords.latitude,position.coords.longitude,position);
          this.setState({position:'lat: '+position.coords.latitude+' lng: '+position.coords.longitude})
        }
      });
    }
    else
    {
      this.setState({position:'NOT_SUPPORTED'})
    }
  }

  getAudio ()
  {
    if (this.state.audioRecordingActive)
    {
      this.mediaRecorder.stop();
      this.setState({audioRecordingActive:false});
    }
    else
    {
      this.setState({audioRecordingActive:true});
      navigator.mediaDevices.getUserMedia({
        audio: true
        // }).then(stream => document.querySelector('#audio').srcObject = stream)
      }).then(stream =>
      {
        console.log('Stream',stream)
        const options = {mimeType: 'audio/webm'};
        const recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(stream, options);
        this.mediaRecorder.addEventListener('dataavailable', function(e) {
          console.log('Get Data',e);
          if (e.data.size > 0) {
            recordedChunks.push(e.data);
          }
        });
        this.mediaRecorder.addEventListener('stop', function() {
          console.log('on Stop',recordedChunks)
          document.querySelector('#audio').src = URL.createObjectURL(new Blob(recordedChunks));
          //let link = document.querySelector('#audioLink');
          //link.href = URL.createObjectURL(new Blob(recordedChunks));
          //link.download = 'test.wav';
        });
        this.mediaRecorder.start();
      }).catch(err => console.log(err.name + ": " + err.message));
    }
  }

  pickContacts ()
  {
    const props = ['name', 'email'];
    const opts = {multiple: true};
    if ('contacts' in navigator && 'ContactsManager' in window)
    {
      navigator.contacts.select(props, opts).then(this.onPickedContacts.bind(this));
    }
    else
    {
      this.setState({contacts:['NOT_SUPPORTED']})
    }
  }

  onPickedContacts (contactsRaw)
  {
    console.log('onPickedContacts',contactsRaw);
    contactsRaw.map((contact) =>
    {
      let nameArr = contact.name[0].split(' ');
      if (nameArr.length >= 2)
      {
        contact.firstName = nameArr.shift();
        contact.lastName = nameArr.join(' ');
        this.state.contacts.push(contact.firstName)
      }
      contact.email = contact.email[0];
      contact.name = contact.name[0];
      contact.selected = true
    });
    this.setState({contacts:this.state.contacts});
  }

  onFileChange (e)
  {
    //console.log('onFileChange',e);
    if (e.target.files) {

      let files = e.target.files;
      for (let s=0;s<files.length;s++)
      {
        let file = files[s];
        let reader = new FileReader();
        let filePreview =  document.querySelector('#filePreview');
        reader.onload = function (e) {

          let img = document.createElement('img');
          img.src = e.target.result;
          filePreview.appendChild(img);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  shareDialog ()
  {
    const shareData = {
      title: 'Sample PWA',
      text: 'Sample PWA Description',
      url: window.location.origin,
    };
    if ('share' in navigator)
    {
      navigator.share(shareData).then(() => {})
    }
    else
    {
      this.setState({share:'NOT_SUPPORTED'})
    }
  }

  render()
  {
    let {view} = this.props;
    let { batteryLevel, clipboardRead, clipboardWrite, position, contacts, share } = this.state;
    return (
     <div>

       {!navigator.onLine ? <div style={{backgroundColor:'green',padding:'10px', color:'#fff'}}>This page is served offline</div> : false}

       <h3>Battery API</h3>
       <button onClick={this.readBattery.bind(this)}>Read Battery</button>
       <label>Battery: {batteryLevel}</label>

       <h3>Clipboard API</h3>
       <button onClick={this.writeClipBoard.bind(this)}>Write to Clipboard</button>
       <input id="clipboardWriteInp" defaultValue="Sample Clipboard text"/>
       {clipboardWrite === 'NOT_SUPORTED' ? <label>Clipboard: {clipboardRead}</label> : false}
       <br/><br/>

       <button onClick={this.readClipBoard.bind(this)}>Read from Clipboard</button>
       <label>Clipboard: {clipboardRead}</label>

       <h3>Geolocation API</h3>
       <button onClick={this.getPosition.bind(this)}>Get Position</button>
       <label>Position: {position}</label>

       <h3>GetUserMedia API (Micro)</h3>
       <button onClick={this.getAudio.bind(this)}>{this.state.audioRecordingActive ? 'Stop' : 'Get'} Micro</button>
       <audio controls id={"audio"}></audio>
       {/*<a id="audioLink">Download from link</a>*/}

       <h3>Contact Picker API (Android only)</h3>
       <button onClick={this.pickContacts.bind(this)}>Get Contacts</button>
       <label>Contacts FirstNames: {contacts.join(' ')}</label>

       <h3>File Picker API (only images)</h3>
       <input onChange={this.onFileChange.bind(this)} accept="image/*" type="file" multiple/>
       <div id={"filePreview"}></div>

       <h3>Share API (only mobile)</h3>
       <button onClick={this.shareDialog.bind(this)}>Share Dialog</button>
       {share === 'NOT_SUPPORTED' ? <label>{share}</label> : false}

     </div>
    );
  }
}


let mapStateToProps = function (state)
{
  return state;
};

let mapDispatchToProps = function (dispatch) {
  return {
    changeView: function (view)
    {
      return dispatch(changeView(view));
    },
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(App);