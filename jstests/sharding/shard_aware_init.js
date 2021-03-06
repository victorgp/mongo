/**
 * Tests for shard aware initialization during process startup (for standalone) and transition
 * to primary (for replica set nodes).
 * @tags: [requires_persistence]
 */

(function() {
    "use strict";

    var waitForMaster = function(conn) {
        assert.soon(function() {
            var res = conn.getDB('admin').runCommand({isMaster: 1});
            return res.ismaster;
        });
    };

    /**
     * Runs a series of test on the mongod instance mongodConn is pointing to. Notes that the
     * test can restart the mongod instance several times so mongodConn can end up with a broken
     * connection after.
     */
    var runTest = function(mongodConn, configConnStr) {
        var shardIdentityDoc = {
            _id: 'shardIdentity',
            configsvrConnectionString: configConnStr,
            shardName: 'newShard',
            clusterId: ObjectId()
        };

        assert.writeOK(mongodConn.getDB('admin').system.version.insert(shardIdentityDoc));

        //
        // TODO: add assert checks here when opObserver for shardIdentity is implemented
        //

        //
        // Test normal startup
        //

        var newMongodOptions = Object.extend(mongodConn.savedOptions, {restart: true});

        MongoRunner.stopMongod(mongodConn.port);
        mongodConn = MongoRunner.runMongod(newMongodOptions);
        waitForMaster(mongodConn);

        var res = mongodConn.getDB('admin').runCommand({shardingState: 1});

        assert(res.enabled);
        assert.eq(shardIdentityDoc.configsvrConnectionString, res.configServer);
        assert.eq(shardIdentityDoc.shardName, res.shardName);
        assert.eq(shardIdentityDoc.clusterId, res.clusterId);

        //
        // Test badly formatted shardIdentity doc
        //

        assert.writeOK(mongodConn.getDB('admin').system.version.update(
            {_id: 'shardIdentity'},
            {_id: 'shardIdentity', shardName: 'x', clusterId: ObjectId()}));

        MongoRunner.stopMongod(mongodConn.port);

        assert.throws(function() {
            mongodConn = MongoRunner.runMongod(newMongodOptions);
            waitForMaster(mongodConn);
        });

        // TODO: add more bad format tests.
    };

    var st = new ShardingTest({shards: 1});

    var mongod = MongoRunner.runMongod();

    runTest(mongod, st.configRS.getURL());

    MongoRunner.stopMongod(mongod.port);

    var replTest = new ReplSetTest({nodes: 1});
    replTest.startSet();
    replTest.initiate();

    runTest(replTest.getPrimary(), st.configRS.getURL());

    // TODO: cleanup properly once --shardsvr checks are added
    // replTest.stopSet();

    st.stop();

})();
