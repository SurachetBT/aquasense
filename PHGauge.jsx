import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { useSpring, animated } from '@react-spring/web';

export default function PHGauge({ PHsensor }) {
  const RADIAN = Math.PI / 180;
  const maxPH= 20;

  const chartData = [
    { name: 'Current', value: PHsensor, color: PHsensor < 4 ? '#ff4d4d' 
      : PHsensor >= 4 && PHsensor <= 6 ? '#c4da02ff' 
      : PHsensor >= 6.5 && PHsensor <= 8.9 ? '#00ab00ff' 
      : PHsensor >= 9 && PHsensor <= 11 ? '#3399ff'
      : '#024d99ff' },

    { name: 'Remaining', value: maxPH - PHsensor, color: '#ddd' }
  ];

  // ใช้ react-spring สร้าง animation
  const { animatedValue } = useSpring({
    animatedValue: PHsensor,
    config: { tension: 120, friction: 20 },
  });

  const cx = 150;
  const cy = 200;
  const iR = 50;
  const oR = 100;

  const needle = (value) => {
    const ang = 180 - (value / maxPH) * 180;
    const length = (iR + 2 * oR) / 3;
    const sin = Math.sin(-RADIAN * ang);
    const cos = Math.cos(-RADIAN * ang);
    const r = 5;
    const x0 = cx + 5;
    const y0 = cy + 5;
    const xba = x0 + r * sin;
    const yba = y0 - r * cos;
    const xbb = x0 - r * sin;
    const ybb = y0 + r * cos;
    const xp = x0 + length * cos;
    const yp = y0 + length * sin;

    return [
      <circle key="needle-circle" cx={x0} cy={y0} r={r} fill="#d0d000" stroke="none" />,
      <path
        key="needle-path"
        d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} L${xba} ${yba}`}
        stroke="none"
        fill="#d0d000"
      />,
    ];
  };

  return (
    <PieChart width={300} height={250}>
      <Pie
        dataKey="value"
        startAngle={180}
        endAngle={0}
        data={chartData}
        cx={cx}
        cy={cy}
        innerRadius={iR}
        outerRadius={oR}
        stroke="none"
      >
        {chartData.map((entry) => (
          <Cell key={`cell-${entry.name}`} fill={entry.color} />
        ))}
      </Pie>

      {/* ใช้ animatedValue เพื่อเข็มเคลื่อนไหว */}
      <animated.g>
        {animatedValue.to((val) => needle(val))}
      </animated.g>

      <animated.text
        x={cx}
        y={cy + 30}
        textAnchor="middle"
        fontSize={24}
        fill="#333"
      >
        {animatedValue.to((val) => `${val.toFixed(2)} PH`)}
      </animated.text>
    </PieChart>
  );
}
