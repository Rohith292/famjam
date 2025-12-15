// backend/src/controllers/analytics.controller.js
import axios from "axios";
import FamilyMember from '../models/family.model.js';
import FamilyGroup from '../models/familyGroup.model.js';
import User from '../models/user.model.js';
import Album from '../models/album.model.js';
import mongoose from 'mongoose';
 // Import spawn
import Collaboration from '../models/collaboration.model.js';


const ML_ENABLED = String(process.env.ML_ENABLED).toLowerCase() === "true";

const isUserInGroup = async (userId, groupId) => {
    if (!mongoose.Types.ObjectId.isValid(groupId)) return false;
    const group = await FamilyGroup.findById(groupId);
    if (!group) return false;
    return group.members.some(memberId => memberId.toString() === userId.toString());
};

const handleChatQuery = async (req, res) => {
    const { query, context } = req.body;
    const userId = req.user._id;

    console.log("Chat Hit");

    if(!ML_ENABLED){
        return res.status(200).json({
            response:"AI insights are currently unavailable due to model deployment issues. You can still browse and manage your family map"
        })
    }

    try {
        const flaskResponse = await axios.post(
    "http://127.0.0.1:5000/predict",
    {
        message: query,   // << THIS is the KEY change
        context: context || null,
        userId: userId.toString(),
    },
    {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
    }
);


        console.log("ML Response:", flaskResponse.data);
        
       const mlModelResponse = flaskResponse.data.response;

        const dbResponse = await queryDatabase(mlModelResponse, userId, context);


        return res.status(200).json({ response: dbResponse.response || dbResponse });

    } catch (error) {
        console.error("Flask communication error:", error);
        return res.status(500).json({ error: "Flask server issue" });
    }
};



// Helper function to query the database based on ML model output
async function queryDatabase(mlModelResponse, userId, context) {
    const db = mongoose.connection.db;
    const members = db.collection('familymembers');

    if (
        mlModelResponse.intent === 'get_parent' &&
        mlModelResponse.entity &&
        mlModelResponse.relation
    ) {
        const relation = mlModelResponse.relation.toLowerCase();
        const expectedGender = {
            father: 'Male',
            mother: 'Female',
            grandfather: 'Male',
            grandmother: 'Female'
        }[relation];

        const member = await FamilyMember.findOne({
            name: new RegExp(`^${mlModelResponse.entity}$`, 'i'),
            createdBy: userId
        });

        if (!member) {
            return { response: `No record found for ${mlModelResponse.entity}.` };
        }

        let targetParent = null;

        // 🧓 Grandparent logic
        if (relation.startsWith('grand')) {
            let grandparent = null;

            const parent = member.parentId ? await FamilyMember.findById(member.parentId) : null;

            // Step 1: Direct grandparent via parent
            if (parent?.parentId) {
                grandparent = await FamilyMember.findById(parent.parentId);
            }

            // Step 2: Partner of parent (e.g., Lakshmi)
            if (!grandparent && parent?.partners?.length) {
                const partner = await FamilyMember.findOne({
                    _id: { $in: parent.partners },
                    gender: relation.includes('mother') ? 'Female' : 'Male'
                });

                if (partner?.parentId) {
                    grandparent = await FamilyMember.findById(partner.parentId);
                }
            }

            // Step 3: Reverse lookup via children
            if (!grandparent && parent) {
                grandparent = await FamilyMember.findOne({
                    children: parent._id,
                    gender: expectedGender,
                    createdBy: userId
                });
            }

            // Step 4: Semantic fallback via notes
            if (!grandparent) {
                grandparent = await FamilyMember.findOne({
                    relation: new RegExp(relation, 'i'),
                    notes: new RegExp(member.name, 'i'),
                    createdBy: userId
                });
            }

            // Step 5: Validate gender or fallback to partner
            if (grandparent?.gender === expectedGender) {
                targetParent = grandparent;
            } else if (grandparent?.partners?.length) {
                targetParent = await FamilyMember.findOne({
                    _id: { $in: grandparent.partners },
                    gender: expectedGender
                });
            }
        }

        // 👨‍👩 Direct parent logic
        else {
            const primaryParent = member.parentId ? await FamilyMember.findById(member.parentId) : null;

            if (primaryParent?.gender === expectedGender) {
                targetParent = primaryParent;
            } else if (primaryParent?.partners?.length) {
                targetParent = await FamilyMember.findOne({
                    _id: { $in: primaryParent.partners },
                    gender: expectedGender
                });
            }

            // Fallback: Reverse lookup via children
            if (!targetParent) {
                targetParent = await FamilyMember.findOne({
                    children: member._id,
                    gender: expectedGender,
                    createdBy: userId
                });
            }

            // Fallback: Semantic match via notes
            if (!targetParent) {
                targetParent = await FamilyMember.findOne({
                    relation: new RegExp(relation, 'i'),
                    notes: new RegExp(member.name, 'i'),
                    createdBy: userId
                });
            }
        }

        // Final response
        if (targetParent) {
            return { response: `${member.name}'s ${relation} is ${targetParent.name}.` };
        } else {
            return { response: `No ${relation} listed for ${member.name}.` };
        }
    }


    else if (
        mlModelResponse.intent === 'get_children' &&
        mlModelResponse.entity
    ) {
        const entityName = mlModelResponse.entity.trim();

        const member = await FamilyMember.findOne({
            name: new RegExp(`^${entityName}$`, 'i'),
            createdBy: userId
        });

        if (!member) {
            return { response: `No record found for ${entityName}.` };
        }

        // Utility: check if two members are siblings
        const isSibling = (a, b) =>
            a?.parentId && b?.parentId && a.parentId.toString() === b.parentId.toString();

        // 1. Direct children
        const directChildren = await FamilyMember.find({
            parentId: member._id,
            createdBy: userId
        });

        // 2. Children from partners (forward + reverse)
        const partnerIds = new Set();

        // Forward partners
        for (const pid of member.partners || []) {
            const partner = await FamilyMember.findById(pid);
            if (partner && !isSibling(member, partner)) {
                partnerIds.add(partner._id.toString());
            }
        }

        // Reverse partners
        const reversePartners = await FamilyMember.find({
            partners: member._id,
            createdBy: userId
        });

        for (const partner of reversePartners) {
            if (!isSibling(member, partner)) {
                partnerIds.add(partner._id.toString());
            }
        }

        const partnerChildren = await FamilyMember.find({
            parentId: { $in: Array.from(partnerIds) },
            createdBy: userId
        });

        // 3. Inferred children via notes (tight match)
        const inferredChildren = await FamilyMember.find({
            notes: new RegExp(`\\b(child of|mother is|father is)\\s+${member.name}\\b`, 'i'),
            createdBy: userId
        });

        // 4. Merge and deduplicate
        const allChildren = [...directChildren, ...partnerChildren, ...inferredChildren];
        const uniqueChildren = Array.from(
            new Map(allChildren.map(c => [c._id.toString(), c])).values()
        );

        if (uniqueChildren.length) {
            const names = uniqueChildren.map(c => c.name).join(', ');
            return { response: `${member.name}'s children: ${names}` };
        } else {
            return { response: `${member.name} has no children listed.` };
        }
    }

    else if (
        mlModelResponse.intent === 'get_sibling' &&
        mlModelResponse.entity &&
        mlModelResponse.relation
    ) {
        const rawEntity = mlModelResponse.entity.trim().toLowerCase();
        const relation = mlModelResponse.relation.trim().toLowerCase();

        const entityMatch = rawEntity.match(/(?:sister|brother)?\s*(?:of)?\s*(.+)/i);
        const entityName = entityMatch ? entityMatch[1].trim() : rawEntity;

        const member = await FamilyMember.findOne({
            name: new RegExp(entityName, 'i'),
            createdBy: userId
        });

        if (!member) {
            return { response: `No record found for ${entityName}.` };
        }

        if (!member.parentId) {
            return { response: `${member.name} has no parent listed, so no siblings can be found. Try adding a parent friend.` };
        }

        const parent = await FamilyMember.findById(member.parentId);
        if (!parent) {
            return { response: `${member.name}'s parent record is missing.` };
        }

        const parentIds = [parent._id];
        if (Array.isArray(parent.partners) && parent.partners.length) {
            parentIds.push(...parent.partners);
        }

        const siblings = await FamilyMember.find({
            parentId: { $in: parentIds },
            _id: { $ne: member._id },
            createdBy: userId
        });

        const genderMap = {
            brother: ['male', 'm'],
            sister: ['female', 'f']
        };

        const expectedGenders = genderMap[relation] || [];
        const filtered = expectedGenders.length
            ? siblings.filter(s => expectedGenders.includes(s.gender?.toLowerCase()))
            : siblings;

        if (filtered.length) {
            const names = filtered.map(s => s.name).join(', ');
            return { response: `${member.name}'s ${relation}(s): ${names}` };
        } else {
            return { response: `${member.name} has no ${relation} listed.` };
        }
    }

    else if (
        mlModelResponse.intent === 'get_details' &&
        mlModelResponse.entity
    ) {
        const entityName = mlModelResponse.entity.trim().toLowerCase();
        const member = await FamilyMember.findOne({
            name: new RegExp(`^${entityName}$`, 'i'),
            createdBy: userId
        });

        if (!member) return { response: `No record found for ${entityName}.` };

        // Format DOB
        const formattedDOB = member.dateOfBirth
            ? new Date(member.dateOfBirth).toLocaleDateString('en-IN')
            : "an unknown date";

        // Get parents
        let parents = [];
        let partnerId = null;

        if (member.parentId) {
            const primaryParent = await FamilyMember.findById(member.parentId);
            if (primaryParent) {
                parents.push(primaryParent.name);

                if (primaryParent.partners?.length) {
                    const partner = await FamilyMember.findOne({
                        _id: { $in: primaryParent.partners },
                        createdBy: userId
                    });
                    if (partner) {
                        parents.push(partner.name);
                        partnerId = partner._id.toString();
                    }
                }
            }
        }

        // Get siblings (only if parentId exists)
        let siblingNames = [];
        if (member.parentId) {
            const siblingCandidates = await FamilyMember.find({
                parentId: member.parentId,
                _id: { $ne: member._id },
                createdBy: userId
            });

            siblingNames = siblingCandidates.map(s => s.name);

            siblingNames = [...new Set(siblingNames)];
        }

        // Pronoun logic
        const pronoun = member.gender === "Female" ? "She" : "He";
        const possessivePronoun = member.gender === "Female" ? "Her" : "His";
        const pastPronoun = member.gender === "Female" ? "Her" : "Him";

        // Notes fallback
        const description = member.notes || "No description available";

        // Parent text fallback
        const parentText = parents.length
            ? `to ${parents.join(" and ")}`
            : "to unknown parents";

        // Final sentence
        return {
            response: `${member.name} was born on ${formattedDOB} ${parentText}. ${
                siblingNames.length
                    ? `${pronoun} has ${siblingNames.length === 1 ? "a sibling" : siblingNames.length + " siblings"} named ${siblingNames.join(", ")}. `
                    : `${pronoun} has no siblings listed. `
                }${possessivePronoun} notes describe ${pastPronoun.toLowerCase()} as "${description}".`
        };
    }

    else if (
        mlModelResponse.intent === 'get_dob' &&
        mlModelResponse.entity
    ) {
        const member = await FamilyMember.findOne({
            name: new RegExp(`^${mlModelResponse.entity}$`, 'i'),
            createdBy: userId
        });
        const formattedDOB = member.dateOfBirth
            ? new Date(member.dateOfBirth).toLocaleDateString('en-IN')
            : "an unknown date";
        return member?.dateOfBirth
            ? { response: `${member.name} was born on ${formattedDOB}.` }
            : { response: `Birthdate not listed for ${mlModelResponse.entity}.` };
    }

    else if (
        mlModelResponse.intent === 'count_brothers' &&
        mlModelResponse.entity
    ) {
        const member = await FamilyMember.findOne({
            name: new RegExp(`^${mlModelResponse.entity}$`, 'i'),
            createdBy: userId
        });

        if (!member) return { response: `No record found for ${mlModelResponse.entity}.` };

        const siblings = await FamilyMember.find({
            parentId: member.parentId,
            _id: { $ne: member._id },
            gender: 'Male',
            createdBy: userId
        });

        return { response: `${member.name} has ${siblings.length} brother(s).` };
    }

    else if (
        mlModelResponse.intent === 'count_sisters' &&
        mlModelResponse.entity
    ) {
        const member = await FamilyMember.findOne({
            name: new RegExp(`^${mlModelResponse.entity}$`, 'i'),
            createdBy: userId
        });

        if (!member) return { response: `No record found for ${mlModelResponse.entity}.` };

        const siblings = await FamilyMember.find({
            parentId: member.parentId,
            _id: { $ne: member._id },
            gender: 'Female',
            createdBy: userId
        });

        return { response: `${member.name} has ${siblings.length} sister(s).` };
    }

    else if (
        mlModelResponse.intent === 'get_bio' &&
        mlModelResponse.entity
    ) {
        const member = await FamilyMember.findOne({
            name: new RegExp(`^${mlModelResponse.entity}$`, 'i'),
            createdBy: userId
        });

        return member?.notes
            ? { response: `${member.name}'s bio: ${member.notes}` }
            : { response: `No bio available for ${mlModelResponse.entity}.` };
    }

    // ... (rest of the code is the same) ...

else if (mlModelResponse.intent === 'get_relation' && mlModelResponse.entity && mlModelResponse.relation) {
    const member = await FamilyMember.findOne({
        name: new RegExp(`^${mlModelResponse.entity}$`, 'i'),
        createdBy: userId
    });

    if (!member || !member.parentId) {
        return { response: `${mlModelResponse.entity} has no parent listed.` };
    }

    const parent = await FamilyMember.findById(member.parentId);
    if (!parent) {
        return { response: `${member.name}'s parent record is missing.` };
    }

    // New logic: Find siblings of the member's parent
    const siblingCandidates = await FamilyMember.find({
        parentId: parent.parentId,
        _id: { $ne: parent._id },
        createdBy: userId // Corrected userId query
    });

    const partnerParents = await FamilyMember.find({
        partners: parent._id,
        createdBy: userId
    });

    const allParents = [parent, ...partnerParents];
    const auntUncleIds = new Set();
    
    // Find siblings of all the member's parents and their partners
    for (const p of allParents) {
        if (p.parentId) {
            const siblingsOfParent = await FamilyMember.find({
                parentId: p.parentId,
                _id: { $ne: p._id },
                createdBy: userId
            });
            for(const sibling of siblingsOfParent) {
                auntUncleIds.add(sibling._id.toString());
            }
        }
    }

    const auntsUncles = await FamilyMember.find({
        _id: { $in: Array.from(auntUncleIds) },
        gender: mlModelResponse.relation.toLowerCase() === 'uncle' ? 'Male' : 'Female'
    });

    if (auntsUncles.length) {
        const names = auntsUncles.map(p => p.name).join(', ');
        return { response: `${member.name}'s ${mlModelResponse.relation}(s): ${names}` };
    } else {
        return { response: `${member.name} has no ${mlModelResponse.relation} listed.` };
    }
}
// ... (rest of the code is the same) ...
    else if (mlModelResponse.intent === 'get_collaborators') {
        const collaborators = await Collaboration.find({ familyMapOwnerId: userId }).populate("collaboratorId", "fullName email");

        if (!collaborators.length) {
            return { response: "You have no collaborators on your map yet." };
        }

        const formatted = collaborators.map(c => {
            const name = c.collaboratorId.fullName || c.collaboratorId.email;
            return `${name}->${c.collaboratorId.email} (${c.role}, ${c.status})`;
        }).join(', ');
        return { response: `Your collaborators: ${formatted}` };
    }
    // ... (rest of the code is the same) ...





else if (mlModelResponse.intent === 'get_collaborator_status' && mlModelResponse.entity) {
    const rawName = mlModelResponse.entity.trim();
    const user = await User.findOne({
        fullName: new RegExp(`^${rawName}$`, 'i')
    });

    if (!user) {
        return { response: `I couldn't find a user named ${rawName}.` };
    }

    const collaboration = await Collaboration.findOne({
        familyMapOwnerId: userId,
        collaboratorId: user._id
    });

    if (!collaboration) {
        return { response: `${rawName} is not a collaborator on your map.` };
    }

    const collaborationStatus = collaboration.status;
    return { response: `${rawName}'s collaboration status is: ${collaborationStatus}.` };
}

// ... (rest of the code for other intents and the final else block) ...
    else if (mlModelResponse.intent === 'get_group_members') {
        return { response: "This feature is not yet implemented. Please try a different query." }
    }
    else {
        return { response: "I'm sorry, I couldn't understand your query." };
    }
}

export { handleChatQuery };