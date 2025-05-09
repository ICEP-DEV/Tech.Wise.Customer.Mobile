
export const OriginReducer = (state,action)=>{
    switch(action.type){
        case 'ADD_ORIGIN':
                return{
                    latitude:action.payload.latitude,
                    longitude:action.payload.longitude,
                    address:action.payload.address,
                    name:action.payload.name
                }
                case 'RESET_ORIGIN':
                    return {
                        latitude: null,
                        longitude: null,
                        address: '',
                        name: '',
                    };
            default:
                return state
    }
}


export const DestinationReducer = (state,action)=>{
    switch(action.type){
        case 'ADD_DESTINATION':
                return{
                    latitude:action.payload.latitude,
                    longitude:action.payload.longitude,
                    address:action.payload.address,
                    name:action.payload.name
                }
                case 'RESET_DESTINATION':
                    return {
                        latitude: null,
                        longitude: null,
                        address: '',
                        name: '',
                    };
            default:
                return state
    }
}