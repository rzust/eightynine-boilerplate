import { motion as m, useMotionValue, useTransform } from 'framer-motion';
import { useState } from 'react';

const ThreeDCard = (props) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [500, -500]);
    const rotateY = useTransform(x, [-100, 100], [-500, 500]);

    // 1. create a new react state for storing last known mouse hover position
    const [pos, setPos] = useState([0, 0])
    // 2. create an event handler for the move event
    const onMove = e => {
        setPos([e.clientX, e.clientY])

        // get position information for the card
        const bounds = e.currentTarget.getBoundingClientRect()

        // set x,y local coordinates
        const xValue = (e.clientX - bounds.x) / e.currentTarget.clientWidth
        const yValue = (e.clientY - bounds.y) / e.currentTarget.clientHeight

        // update MotionValues
        x.set(xValue, true)
        y.set(yValue, true)
    }

    return (
        <div className="perspective w-full h-screen flex justify-center items-center">
            <m.div 
                className="
                    border border-black rounded-xl dark:border-white w-96 h-32
                    bg-gradient-to-tr from-cyan-500 to-blue-500
                    cursor-grab
                    relative
                "
                style={{x, y, rotateX, rotateY, z: 100}}
                drag dragElastic={0.16} dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                whileTap={{cursor: "grabbing"}} 
                onPointerMove={onMove}
            >
                Hover Position: (x: {pos[0]}:{x.get()}, y: {pos[1]}:{y.get()})
                {props.children}
            </m.div>
        </div>
    )
}

export default ThreeDCard;