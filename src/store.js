import { createStore } from "redux";
import combinedReducers from "./reducers/index";

function configureStore(state) {
    return createStore(combinedReducers,state);
}

export default configureStore;