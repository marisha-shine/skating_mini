/**
 * GroupController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */


module.exports = {
  add: async function(req, res){
    let group = req.body;
    if (!group) res.badRequest('Empty body!');
    try {
        let created = await Group.create({
            name: group.name,
            type: group.type,
            sortOrder: group.sortOrder
        }).fetch();
        group.dances.forEach(x => {
            x.group = created.id;
        });
        await Dance.createEach(group.dances);
        res.ok();
    } catch (error) {
        res.badRequest(error);
    }
  }
};

