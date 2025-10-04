// tempData.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function TempData({ onData }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
    axios.get("http://172.20.10.6:8080/get_data/temperature")
      .then(response => {
          const latest = response.data; // API ส่ง object เดียว
          setData(latest);

          if (onData && latest.temperature !== undefined) {
            onData(latest.temperature); // ส่งค่า temperature ไป parent
          }
        })
        .catch(err => console.error("Error fetching data:", err));
    }, 1000); // fetch ทุก 2 วินาที

    return () => clearInterval(interval);
  }, [onData]);

  return (
    <div>
      <h2>temperature Sensor Data</h2>
      {data ? (
        <p>ค่า อุณหภูมิ :{data.temperature} | เวลา: {data.timestamp}</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}