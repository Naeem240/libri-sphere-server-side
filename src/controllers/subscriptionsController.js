async function getSubscriptions(req, res) {
  try {
    const subscriptions = await req.db
      .collection('subscriptions')
      .find({})
      .project({ name: 1, email: 1, subscribedAt: 1 })
      .sort({ subscribedAt: -1 })
      .toArray();

    res.send(subscriptions);
  } catch (err) {
    res.status(500).send({ message: 'Internal server error' });
  }
}

async function addSubscription(req, res) {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).send({ message: 'Name and email required' });

    const existing = await req.db.collection('subscriptions').findOne({ email });
    if (existing) return res.status(409).send({ message: 'Email already subscribed' });

    const result = await req.db.collection('subscriptions').insertOne({
      name,
      email,
      subscribedAt: new Date()
    });

    res.send({ success: true, insertedId: result.insertedId });
  } catch (err) {
    res.status(500).send({ message: 'Internal server error' });
  }
}

module.exports = { getSubscriptions, addSubscription };
