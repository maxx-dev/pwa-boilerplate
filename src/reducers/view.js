const view = (state , action) => {

    switch (action.type) {
        case 'CHANGE_VIEW':
            return action.view;
        default:
            return state || null
    }
};

export default view
