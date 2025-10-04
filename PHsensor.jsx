import React, { useEffect, useState } from "react";
import axios from "axios";

export default function PHData({ onData }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      axios.get("http://172.20.10.6:8080/get_data/ph")
        .then(response => {
          const latest = response.data; // API ส่ง object เดียว
          setData(latest);

          if (onData && latest.ph !== undefined) {
            onData(latest.ph); // ส่งค่า ph ไป parent
          }
        })
        .catch(err => console.error("Error fetching data:", err));
    }, 1000); // fetch ทุก 2 วินาที

    return () => clearInterval(interval);
  }, [onData]);

  return (
    <div>
      <h2>PH Sensor Data</h2>
      {data ? (
        <p>ค่า PH : {data.ph} | เวลา: {data.timestamp}</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}