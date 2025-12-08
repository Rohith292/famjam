// Corrected frontend/src/components/family/FamilyTreeCanvas.jsx

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    // REMOVED: useNodesState, useEdgesState - not needed here
    addEdge,
    MarkerType,
    Handle,
    Position,
} from 'reactflow';

import 'reactflow/dist/style.css';

// Custom Node for Family Members
const FamilyMemberNode = ({ data, id }) => {
    const nodeBgColor = data.gender === 'Male' ? data.nodeColorMale : data.gender === 'Female' ? data.nodeColorFemale : '#6b7280';
    const defaultNodeProfilePic = "https://placehold.co/40x40/334155/cbd5e1?text=👤";

    return (
        <div
            className={`relative rounded-xl shadow-lg p-4 text-center border-2 border-gray-700
            text-white cursor-pointer hover:shadow-xl transition-shadow duration-200`}
            style={{ backgroundColor: nodeBgColor }}
            onClick={() => data.onClick(id)}
        >
            <Handle type="source" position={Position.Bottom} id="a" style={{ borderRadius: '50%' }} />
            <Handle type="target" position={Position.Top} id="b" style={{ borderRadius: '50%' }} />

            <div className="mb-2 flex justify-center">
                <img
                    src={data.photoURL || defaultNodeProfilePic}
                    alt={`${data.name}'s profile`}
                    className="w-10 h-10 rounded-full object-cover border border-gray-400"
                    onError={(e) => { e.target.src = defaultNodeProfilePic; }}
                />
            </div>

            {/* NEW: This is where you render the icon from the node data */}
            <div className="absolute top-2 right-2 text-xl">{data.icon}</div>

            <div className="font-bold text-lg">{data.name}</div>
            {data.relation && <div className="text-sm opacity-80">({data.relation})</div>}
        </div>
    );
};


// Invisible Node for Partnerships/Marriages
const InvisibleMarriageNode = () => (
    <div style={{
        width: 20,
        height: 20,
        background: 'rgba(255, 0, 0, 0)',
        borderRadius: '50%',
        opacity: 0.7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid transparent',
        pointerEvents: 'auto',
    }}>
        <Handle type="target" position={Position.Top} id="partner1" style={{ left: '40%', borderRadius: '50%', opacity: 0 }} />
        <Handle type="target" position={Position.Top} id="partner2" style={{ left: '60%', borderRadius: '50%', opacity: 0 }} />
        <Handle type="source" position={Position.Bottom} id="children" style={{ borderRadius: '50%', opacity: 0 }} />
    </div>
);


function FamilyTreeCanvas({ nodes, edges, onNodesChange, onEdgesChange, customization }) {
    // The nodes and edges are now directly used as props from the parent component.
    const nodeTypes = useMemo(() => ({
        familyMember: FamilyMemberNode,
        marriage: InvisibleMarriageNode,
    }), []);

    // This handler will update the edges state correctly in the parent component
    const onConnect = useCallback((params) => onEdgesChange((eds) => addEdge(params, eds)), [onEdgesChange]);

    return (
        <div className="w-full h-full bg-gray-800 rounded-lg shadow-inner relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange} // Pass the parent's onNodesChange
                onEdgesChange={onEdgesChange} // Pass the parent's onEdgesChange
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
            >
                <MiniMap />
                <Controls />
                <Background variant="dots" gap={12} size={1} />
            </ReactFlow>

            {(!nodes || nodes.length === 0) && (
                <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl text-gray-400">
                    Add members to see your family tree!
                </p>
            )}
        </div>
    );
}

export default FamilyTreeCanvas;