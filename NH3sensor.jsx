// NH3sensor.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function NH3Data({ onData }) {
  const [data, setData] = useState(null);

    useEffect(() => {
    const interval = setInterval(() => {
    axios.get("http://172.20.10.6:8080/get_data/nh3")
        .then(response => {
          const latest = response.data; // API ส่ง object เดียว
          setData(latest);

          if (onData && latest.NH3 !== undefined) {
            onData(latest.NH3); // ส่งค่า NH3 ไป parent
          }
        })
        .catch(err => console.error("Error fetching data:", err));
    }, 1000); // fetch ทุก 2 วินาที

    return () => clearInterval(interval);
  }, [onData]);

  return (
    <div>
      <h2>NH3 Sensor Data</h2>
      {data ? (
        <p>ค่า NH3: {data.NH3} | เวลา: {data.timestamp}</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
