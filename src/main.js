import React from 'react';
import ReactDOM from 'react-dom';
import './style/index.scss';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { Provider } from "react-redux";
import configureStore from "./store";
let store = configureStore({view:{view:'ROOT'}});
//if (process.env.ENV === 'PRODUCTION') console.log('VERSION',process.env.VERSION,'BUILD_TIME',process.env.BUILD_TIME);
window.app = {};
ReactDOM.render(
    <Provider store={store}>
        {<App/>}
    </Provider>
, document.getElementById('root'));
serviceWorker.register();
