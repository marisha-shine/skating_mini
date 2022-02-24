module.exports = {
    save: async function(req, res) { 
        let rates = req.body;
        if (!rates) res.badRequest('Empty body!');
        if (rates.length == 0) res.badRequest('Empty rates array');
        try {
            await Rate.createEach(rates);
            res.ok();
        } catch (error) {
            res.badRequest(error);
        }
    },
    
    rerate: async function(req,res) {
        let rates = req.body;
        if (!rates) res.badRequest('Empty body!');
        if (rates.length == 0) res.badRequest('Empty rates array');
        try {
            for (let i = 0; i < rates.length; i++) {
                const rate = rates[i];
                await Rate.updateOne(rate.id).set({
                    judge: rate.judge,
                    group: Number(rate.group),
                    member: Number(rate.member),
                    place: Number(rate.place)
                });
            }
            res.ok();
        } catch (error) {
            res.badRequest(error);
        }
    },

    remove: async function(req,res) {
        let rates = req.body;
        if (!rates) res.badRequest('Empty body!');
        if (rates.length == 0) res.badRequest('Empty rates array');
        try {
            for (let i = 0; i < rates.length; i++) {
                const rate = rates[i];
                await Rate.destroyOne(rate.id);
            }
            res.ok();
        } catch (error) {
            res.badRequest(error);
        }
    }
};

