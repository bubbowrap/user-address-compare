import React from 'react'
import ReactDOM from 'react-dom'
import { connect } from 'react-redux'

import { fetchAddresses, fetchEvents, fetchSelectedEventDetails } from './thunks'
import { eventGuid, canSelectEvents, undeletedAddresses } from './selectors'
import { actions } from './redux-store'

import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';

//--> User select form
const submitHandler = (dispatch, userId) => (e) => {
  e.preventDefault()

  dispatch({
    type: actions.CHANGE_SELECTED_USER_ID,
    payload: userId
  })
}

const changeHandler = (dispatch) => (e) => {
  const val = e.target.value

  dispatch({
    type: actions.CHANGE_SELECTED_USER_ID,
    payload: val
  })
  dispatch(fetchAddresses(val))
}

let UserSelectForm = ({ dispatch, userIds, selectedUserId }) => {
  return <form action="{API_BASE}/users/{selectedUserId}/addresses" method="GET" onSubmit={submitHandler(dispatch, selectedUserId)}>
    <select onChange={changeHandler(dispatch)} value={selectedUserId || ''}>
      <option>Select User ID</option>
      {userIds.map((id) => {
        return <option key={id} value={id}>{id}</option>
      })}
    </select>
  </form>
}
UserSelectForm = connect(state => state)(UserSelectForm)



//--> Events list
const handleEventToggle = (dispatch, guid) => (e) => {
  dispatch({
    type: actions.TOGGLE_EVENT_SELECTION,
    payload: guid
  })
}
let Event = ({ dispatch, event, guid, isSelected, isEnabled }) => {
  return <li>
    <input id={guid} type="checkbox" checked={isSelected} disabled={!isEnabled} onChange={handleEventToggle(dispatch, guid)} />
    <label htmlFor={guid}>
      {event.type} | {event.created_at}
    </label>
  </li>
}
Event = connect((state, ownProps) => {
  const isSelected = !!state.selectedEvents[ownProps.guid]
  return {
    isSelected : isSelected,
    isEnabled : isSelected || canSelectEvents(state.selectedEvents)
  }
})(Event)


const handleCompareClick = (dispatch) => (e) => {
  dispatch(fetchSelectedEventDetails());
  dispatch({
    type: actions.COMPARE_SELECTED_EVENTS
  })
}

const handleCloseCompareClick = (dispatch) => (e) => {
  dispatch({
    type: actions.EXIT_COMPARE_MODE
  })
}

let EventList = ({dispatch, canCompare, events}) => {
  return <>
    <button onClick={handleCompareClick(dispatch)} disabled={!canCompare}>Compare</button>
    <ul>
      {events.map((event) => {
        return <Event event={event} key={eventGuid(event)} guid={eventGuid(event)} />
      })}
    </ul>
  </>
}
EventList = connect(state => {
  return { canCompare : Object.keys(state.selectedEvents).length > 1 }
})(EventList)



//--> Addresses list
const handleAddressClick = (dispatch, id) => (e) => {
  e.preventDefault()

  dispatch({
    type: actions.REQUEST_ADDRESS_DETAILS,
    payload: id
  })
  dispatch(fetchEvents(id))
}


let Address = ({ dispatch, addressJson, isSelected }) => {
  return <li onClick={handleAddressClick(dispatch, addressJson.id)} className={isSelected ? 'selected' : ''}>
    <pre>{JSON.stringify(addressJson, undefined, 2)}</pre>
  </li>
}
Address = connect((state, ownProps) => {
  return { isSelected : state.selectedAddressId === ownProps.addressJson.id }
})(Address)



//--> Compare Modal
let CompareModal = ({dispatch, children}) => {
  return (
      <>
        {ReactDOM.createPortal(
          <>
          <div className="modalContent">
              <button className="modalCloseBtn" onClick={handleCloseCompareClick(dispatch)}>x</button>
              {children}
          </div>
          <div className="modalBackdrop" onClick={handleCloseCompareClick(dispatch)}></div>
          </>,
          document.getElementById('compareModal')
        )}
      </>
  )
}
CompareModal = connect(state => state)(CompareModal)



//--> App wrapper
let App = ({ addresses, events, userIds, selectedUserId, selectedAddressId, comparingEvents, comparisonJson, error} ) => {
  return <>
    {error && !userIds.length ? <p className="error">{error}</p> : ''}
    {userIds && userIds.length ?
      <UserSelectForm userIds={userIds} selectedUserId={selectedUserId} />
    : ''}
    <div className="addresses">
      <h2>Address Information</h2>
      {addresses && addresses.length
        ? <ul>
            {addresses.map((address) => {
              return <Address key={address.id} addressJson={address} />
            })}
          </ul>
        : <p>{selectedUserId ? 'No addresses found.' : 'Choose a user ID from the dropdown above.'}</p>
      }
    </div>
    <div className="events">
      <h2>Events</h2>
      { events && events.length
        ? <EventList events={events} />
        : <p>{selectedAddressId ? 'No events found.' : 'Select an address to see events'}</p>
      }
    </div>   
    { comparingEvents && comparisonJson
      ? 
      <CompareModal>
        <ReactDiffViewer 
          oldValue={JSON.stringify(comparisonJson[0], undefined, 4)}
          newValue={JSON.stringify(comparisonJson[1], undefined, 4)}
          compareMethod={DiffMethod.WORDS}
          splitView={true} 
        /> 
      </CompareModal>
      : '' 
    }
  </>
}
App = connect(state => {
  return {
    addresses : undeletedAddresses(state.addresses),
    ...state
  }
})(App)


export { App }
