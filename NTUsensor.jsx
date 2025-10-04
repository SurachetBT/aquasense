import React, { useEffect, useState } from "react";
import axios from "axios";

export default function NTUData({ onData }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      axios.get("http://172.20.10.6:8080/get_data/turbidity")
        .then(response => {
          const latest = response.data; // API ส่ง object เดียว
          setData(latest);

          if (onData && latest.NTU !== undefined) {
            onData(latest.NTU); // ส่งค่า NTU ไป parent
          }
        })
        .catch(err => console.error("Error fetching data:", err));
    }, 1000); // fetch ทุก 2 วินาที

    return () => clearInterval(interval);
  }, [onData]);

  return (
    <div>
      <h2>Turbidity Sensor Data</h2>
      {data ? (
        <p>ค่า NTU: {data.NTU} | เวลา: {data.timestamp}</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
