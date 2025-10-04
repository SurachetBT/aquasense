import React, { useState } from "react";
import NTUData from "./NTUsensor";
import TurbidityGauge from "./turbidityGauge";
import PHGauge from "./PHGauge";  
import PHData from "./PHsensor";
import NH3Data from "./NH3sensor";
import NH3Gauge from "./NH3Gauge";
import TempData from "./tempsensor";
import TempGauge from "./tempGauge";

export default function App() {
  const [ntu, setNtu] = useState(0);
  const [ph, setPH] = useState(0);
  const [NH3,setNH3] =useState(0);
  const [temp,setTemp] =useState(0);

  return (
    <div className="App">
      <NTUData onData={setNtu} />
      <TurbidityGauge turbidity={ntu} />
      <PHData onData={setPH} />
      <PHGauge PHsensor={ph} />
      <NH3Data onData={setNH3}/>
      <NH3Gauge NH3sensor={NH3}/>
      <TempData onData={setTemp}/>
      <TempGauge temperature={temp}/>


    </div>
  );
}
