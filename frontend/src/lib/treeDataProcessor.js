// frontend/src/utils/treeDataProcessor.js

import { MarkerType } from 'reactflow';
import dagre from '@dagrejs/dagre';

// Initialize Dagre graph for layout calculations
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const defaultNodeWidth = 180;
const defaultNodeHeight = 100;
const marriageNodeWidth = 20;
const marriageNodeHeight = 20;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 });

    nodes.forEach((node) => {
        const currentWidth = node.type === 'marriage' ? marriageNodeWidth : defaultNodeWidth;
        const currentHeight = node.type === 'marriage' ? marriageNodeHeight : defaultNodeHeight;
        dagreGraph.setNode(node.id, { width: currentWidth, height: currentHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const newPosition = nodeWithPosition
            ? {
                x: nodeWithPosition.x - dagreGraph.node(node.id).width / 2,
                y: nodeWithPosition.y - dagreGraph.node(node.id).height / 2,
            }
            : { x: 0, y: 0 };
        return { ...node, position: newPosition };
    });

    return { nodes: layoutedNodes, edges };
};

export const processFamilyMembersForReactFlow = (familyMembers, onMemberClick, customization) => {
    const nodes = [];
    const edges = [];
    const memberIdMap = new Map();

    // --- Pass 1: Create all Person Nodes ---
    familyMembers.forEach(member => {
        if (typeof member._id === 'string' && member._id.length > 0) {
            const isMale = member.gender === 'Male';
            const memberNode = {
                id: member._id,
                type: 'familyMember',
                data: {
                    ...member,
                    onClick: onMemberClick,
                    icon: isMale ? customization.maleIcon : customization.femaleIcon,
                    nodeColorMale: customization.nodeColorMale,
                    nodeColorFemale: customization.nodeColorFemale,
                },
                position: { x: 0, y: 0 },
                draggable: true,
                style: {
                    width: defaultNodeWidth,
                    height: defaultNodeHeight,
                    backgroundColor: isMale ? customization.nodeColorMale : customization.nodeColorFemale,
                }
            };
            nodes.push(memberNode);
            memberIdMap.set(member._id, memberNode);
        } else {
            console.warn("Skipping member due to invalid _id:", member);
        }
    });

    const processedPartnershipKeys = new Set();

    // --- Pass 2: Create Marriage Nodes and Partner-to-Marriage Edges ---
    familyMembers.forEach(member => {
        if (member.partners && Array.isArray(member.partners)) {
            member.partners.forEach(partnerRef => {
                const partnerId = partnerRef._id || partnerRef;
                if (typeof partnerId === 'string' && memberIdMap.has(partnerId) && member._id !== partnerId) {
                    const sortedIds = [member._id, partnerId].sort();
                    const partnershipKey = `${sortedIds[0]}-${sortedIds[1]}`;

                    if (!processedPartnershipKeys.has(partnershipKey)) {
                        const marriageNodeId = `marriage-${partnershipKey}`;

                        const marriageNode = {
                            id: marriageNodeId,
                            type: 'marriage',
                            position: { x: 0, y: 0 },
                            data: {
                                label: '',
                                partners: [member._id, partnerId],
                                children: [],
                            },
                            draggable: true,
                            selectable: false,
                            style: {
                                width: marriageNodeWidth,
                                height: marriageNodeHeight,
                                backgroundColor: customization.edgeColorPartner,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${customization.edgeColorPartner}`,
                            }
                        };
                        nodes.push(marriageNode);
                        memberIdMap.set(marriageNodeId, marriageNode);

                        edges.push(
                            {
                                id: `e-${member._id}-${marriageNodeId}`,
                                source: member._id,
                                target: marriageNodeId,
                                type: customization.edgeType,
                                style: { stroke: customization.edgeColorPartner, strokeWidth: 2, strokeDasharray: '5,5' },
                                markerEnd: { type: MarkerType.ArrowClosed },
                                sourceHandle: 'a',
                                targetHandle: 'partner1',
                            },
                            {
                                id: `e-${partnerId}-${marriageNodeId}`,
                                source: partnerId,
                                target: marriageNodeId,
                                type: customization.edgeType,
                                style: { stroke: customization.edgeColorPartner, strokeWidth: 2, strokeDasharray: '5,5' },
                                markerEnd: { type: MarkerType.ArrowClosed },
                                sourceHandle: 'a',
                                targetHandle: 'partner2',
                            }
                        );
                        processedPartnershipKeys.add(partnershipKey);
                    }
                }
            });
        }
    });

    // --- Pass 3: Create Parent-to-Child Edges (corrected logic) ---
    familyMembers.forEach(member => {
        let parentId = null;
        // Handle both object and string parentId formats
        if (member.parentId && typeof member.parentId === 'object' && member.parentId._id) {
            parentId = member.parentId._id;
        } else if (typeof member.parentId === 'string') {
            parentId = member.parentId;
        }

        if (parentId && memberIdMap.has(parentId)) {
            const parentNodeId = parentId;
            const parentMember = memberIdMap.get(parentNodeId)?.data;

            let sourceNodeForChild = parentNodeId;
            let sourceHandleForChild = 'a';

            if (parentMember && parentMember.partners && Array.isArray(parentMember.partners) && parentMember.partners.length > 0) {
                const potentialMarriageNode = nodes.find(node =>
                    node.type === 'marriage' &&
                    node.data.partners &&
                    (node.data.partners.includes(parentNodeId) && parentMember.partners.some(p => node.data.partners.includes(p._id || p)))
                );

                if (potentialMarriageNode) {
                    sourceNodeForChild = potentialMarriageNode.id;
                    sourceHandleForChild = 'children';
                    if (!potentialMarriageNode.data.children.includes(member._id)) {
                        potentialMarriageNode.data.children.push(member._id);
                    }
                }
            }
            
            edges.push({
                id: `e-${sourceNodeForChild}-${member._id}`,
                source: sourceNodeForChild,
                sourceHandle: sourceHandleForChild,
                target: member._id,
                targetHandle: 'b',
                type: customization.edgeType,
                style: { stroke: customization.edgeColorParentChild, strokeWidth: 1.5 },
                markerEnd: { type: MarkerType.ArrowClosed },
            });
        }
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, 'TB');
    return { nodes: layoutedNodes, edges: layoutedEdges };
};