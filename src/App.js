import logo from './logo.svg';
import './App.css';
import React from 'react'
import { render } from "react-dom";
// Import React Table
import ReactTable from "react-table";
import { useTable } from 'react-table'
import mqtt from "mqtt"

const { SingleNodeClient, MqttClient } = require("@iota/iota.js");

const url = "https://api.hornet-1.testnet.chrysalis2.com"
const url_mqtt = "api.hornet-0.testnet.chrysalis2.com:1883"

const client = new SingleNodeClient(url)
const sampleIndexEncoded = "445241454745525f53454e535f3161"
const sampleIndex = "DRAEGER_SENS_1a"


const keys = ['payload', 'date', 'time', 'dev_id', ''];



function parseMessage(m) {

  let raw_value = JSON.parse(Buffer.from (m.payload.data, 'hex').toString('utf-8'))
  let ret_value = {}
  
  for (const elem of keys){
    ret_value[elem] = raw_value[elem]
  }

  ret_value.messageId = raw_value['messageId']
  return ret_value


}
class Example extends React.Component{
  constructor(props){
    super(props)
    let self = this
    this.state = {samples: []}
    this.componentWillMount = this.componentWillMount.bind(this)
  }

  MqttUpdateTable(m){
    console.log("updating table!")
    console.log(m);
  }

  componentWillMount(){




    client.messagesFind(sampleIndex).then( (obj) => {
      //we do it C style:
      let self = this
      let promises = []
      self.setState({...self.state,
      ids: obj.messageIds})

      for (let i = 0; i < obj.count; i++){
        promises[i] = client.message(obj.messageIds[i]).then(parseMessage)
      }
      Promise.all(promises).then( (values) => {
        // console.log(values)
        self.setState  ({ ...self.state,
          samples : values}) ;
      })
    })
    //set event listener
    
    
  }

  updateSamples(){
    console.log('updating samples . . . ')
    client.messagesFind(sampleIndex).then( (obj) => {
      //we do it C style:
      let self = this
      let promises = []
      let old_ids = this.state.ids;
      let old_samples = self.state.samples

      let new_ids = obj.messageIds.filter( id => !old_ids.includes(id))
      console.log('new ids: ')
      console.log(new_ids)

      

      for (let i = 0; i < new_ids.length; i++){
        promises[i] = client.message(new_ids[i]).then(parseMessage)
      }
      // add new ids and samples 
      Promise.all(promises).then( (values) => {
        console.log('adding new values . . . ')
        console.log(values)
        self.setState  ({
           samples : old_samples.concat(values),
           ids: obj.messageIds
        }) ;
      })
    })
    //set event listener
    
  }

  componentDidMount(){
      // get all current messages that have been used


      // listener.index(sampleIndexEncoded, this.MqttUpdateTable)

    this.interval = setInterval(() => {
      this.setState({ time: Date.now() });
      this.updateSamples()
    // some other call to refresh api;
  }, 10000);

  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }



  render(){
    return(

        <SimpleTable data={this.state.samples}></SimpleTable>
    )
  }

}

function SimpleTable(props){
    const data = props.data;
    const PAGE_SIZE = 25

    const columns = React.useMemo(
      () => [
        {
          Header: 'Payload',
          accessor: 'payload', // accessor is the "key" in the data
        },
        {
          Header: 'Date',
          accessor: 'date',
        },
        {
          Header: 'Time',
          accessor: 'time',
        },
        {
          Header: 'Device ID',
          accessor: 'dev_id',
        },
      ],
      []
    )
    var tableInstance = useTable({
      columns, 
      data
    })

    var x = -1;
    const getkeyunique = () => {
      x = x + 1;
      return x;
    }

    const {
      getTableProps,
      getTableBodyProps,
      headerGroups,
      rows,
      prepareRow
    } = tableInstance
    return !props.data.length ? (<div>loading . . . make sure you've created some games beforehand!</div>) : (
        <div className="container1">
          <table {...getTableProps()} >
            <thead>
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map(column => (
                    <th {...column.getHeaderProps()}>{column.render("Header")}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()} >
              {rows.map((row, i) => {
                prepareRow(row);
                // console.log({"Row":row.cells});

                return (
                  <tr {...row.getRowProps()} key={getkeyunique()} >
                    {row.cells.map((cell, count) => {
                      
                        return <td {...cell.getCellProps()} key={getkeyunique()}>{cell.render('Cell')}</td>;  

                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div> )
}
function App() {
  return (
    
    <div className="App">
      <Example></Example>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
