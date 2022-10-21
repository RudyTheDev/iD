describe('iD.operationSplice', function () {
    var fakeContext;
    var graph;

    // Set up the fake context
    fakeContext = {};
    fakeContext.graph = function() { return graph; };

    describe('valid geometry - area', function () {

        beforeEach(function () {
            //
            // Situation:
            //    b ---> c
            //    ^ \    |
            //    |    \ v
            //    a <--- d
            //
            //    Area a-b-c-d-a
            //    Cut line b-d

            var a = iD.osmNode({ id: 'a', loc: [0, 0] });
            var b = iD.osmNode({ id: 'b', loc: [0, 1] });
            var c = iD.osmNode({ id: 'c', loc: [1, 1] });
            var d = iD.osmNode({ id: 'd', loc: [1, 0] });

            graph = iD.coreGraph([
                a, b, c, d,
                iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'], tags: { area: 'yes' } }),
                iD.osmWay({ id: 'cutline', nodes: ['b', 'd'] })
            ]);
        });

        describe('#not_available', function () {

            it('for no selected ids', function () {
                expect(iD.operationSplice(fakeContext, []).available()).to.be.not.ok;
            });

            it('for selected area', function () {
                expect(iD.operationSplice(fakeContext, [ 'area' ]).available()).to.be.not.ok;
            });

            it('for selected cutline, area and some node', function () {
                expect(iD.operationSplice(fakeContext, [ 'area', 'cutline', 'a' ]).available()).to.be.not.ok;
            });

            it('for selected area and node', function () {
                expect(iD.operationSplice(fakeContext, [ 'area', 'b' ]).available()).to.be.not.ok;
            });

            it('for selected cutline\'s node', function () {
                expect(iD.operationSplice(fakeContext, [ 'b', 'd' ]).available()).to.be.not.ok;
            });

            it('for selected area and cutline\'s node', function () {
                expect(iD.operationSplice(fakeContext, [ 'area', 'b', 'd' ]).available()).to.be.not.ok;
            });
        });

        describe('#available', function () {

            it('for selected cutline', function () {
                expect(iD.operationSplice(fakeContext, [ 'cutline' ]).available()).to.be.ok;
            });

            it('for selected cutline and area', function () {
                expect(iD.operationSplice(fakeContext, [ 'cutline', 'area' ]).available()).to.be.ok;
                expect(iD.operationSplice(fakeContext, [ 'area', 'cutline' ]).available()).to.be.ok;
            });
        });
    });

    describe('invalid geometry - loop', function () {

        beforeEach(function () {
            //
            // Situation:
            //    b ---> c
            //    ^ \    |
            //    |    \ v
            //    a <--- d
            //
            //    Loop (closed way but not area) a-b-c-d-a
            //    Cut line b-d

            var a = iD.osmNode({ id: 'a', loc: [0, 0] });
            var b = iD.osmNode({ id: 'b', loc: [0, 1] });
            var c = iD.osmNode({ id: 'c', loc: [1, 1] });
            var d = iD.osmNode({ id: 'd', loc: [1, 0] });

            graph = iD.coreGraph([
                a, b, c, d,
                iD.osmWay({ id: 'loop', nodes: ['a', 'b', 'c', 'd', 'a'] }),
                iD.osmWay({ id: 'cutline', nodes: ['b', 'd'], tags: { interesting: 'yes' } })
            ]);
        });

        describe('#not_available', function () {

            it('for selected cutline', function () {
                expect(iD.operationSplice(fakeContext, [ 'cutline' ]).available()).to.be.not.ok;
            });

            it('for selected cutline and area', function () {
                expect(iD.operationSplice(fakeContext, [ 'cutline', 'loop' ]).available()).to.be.not.ok;
                expect(iD.operationSplice(fakeContext, [ 'loop', 'cutline' ]).available()).to.be.not.ok;
            });

            it('for selected area', function () {
                expect(iD.operationSplice(fakeContext, [ 'loop' ]).available()).to.be.not.ok;
            });
        });
    });

    describe('valid geometry - separated multipolygon', function () {

        beforeEach(function () {
            //
            // Situation:
            //    b ---> c       y ---> w
            //    ^ \    |       ^      |
            //    |    \ |       |      v
            //    a <--- d       u <--- z
            //
            //    Area a-b-c-d-a
            //    Cut line b-d
            //    Another area u-y-w-z-u
            //    Multipolygon Relation with members Area and Another area

            var a = iD.osmNode({ id: 'a', loc: [0, 0] });
            var b = iD.osmNode({ id: 'b', loc: [0, 1] });
            var c = iD.osmNode({ id: 'c', loc: [1, 1] });
            var d = iD.osmNode({ id: 'd', loc: [1, 0] });
            var u = iD.osmNode({ id: 'u', loc: [2, 0] });
            var y = iD.osmNode({ id: 'y', loc: [2, 1] });
            var w = iD.osmNode({ id: 'w', loc: [3, 1] });
            var z = iD.osmNode({ id: 'z', loc: [2, 1] });

            graph = iD.coreGraph([
                a, b, c, d, u, y, w, z,
                iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
                iD.osmWay({ id: 'another', nodes: ['y', 'w', 'u', 'z', 'y'] }),
                iD.osmWay({ id: 'cutline', nodes: ['b', 'd'] }),
                iD.osmRelation({ id: 'rel', tags: { type: 'multipolygon', area: 'yes' }, members: [
                    { id: 'area', type: 'way', role: 'outer' },
                    { id: 'another', type: 'way', role: 'outer' }
                ]})
            ]);
        });

        describe('#not_available', function () {

            it('for selected cutline and other area', function () {
                expect(iD.operationSplice(fakeContext, [ 'cutline', 'another' ]).available()).to.be.not.ok;
                expect(iD.operationSplice(fakeContext, [ 'another', 'cutline' ]).available()).to.be.not.ok;
            });
        });

        describe('#available', function () {

            it('for selected cutline', function () {
                expect(iD.operationSplice(fakeContext, [ 'cutline' ]).available()).to.be.ok;
            });

            it('for selected cutline and area', function () {
                expect(iD.operationSplice(fakeContext, [ 'cutline', 'area' ]).available()).to.be.ok;
                expect(iD.operationSplice(fakeContext, [ 'area', 'cutline' ]).available()).to.be.ok;
            });
        });
    });

    describe('invalid geometry - relation', function () {

        beforeEach(function () {
            //
            // Situation:
            //    b ---> c       y ---> w
            //    ^ \    |       ^      |
            //    |    \ |       |      v
            //    a <--- d       u <--- z
            //
            //    Area a-b-c-d-a
            //    Cut line b-d
            //    Another area u-y-w-z-u
            //    Random Relation wtih members Area and Another area

            var a = iD.osmNode({ id: 'a', loc: [0, 0] });
            var b = iD.osmNode({ id: 'b', loc: [0, 1] });
            var c = iD.osmNode({ id: 'c', loc: [1, 1] });
            var d = iD.osmNode({ id: 'd', loc: [1, 0] });
            var u = iD.osmNode({ id: 'u', loc: [2, 0] });
            var y = iD.osmNode({ id: 'y', loc: [2, 1] });
            var w = iD.osmNode({ id: 'w', loc: [3, 1] });
            var z = iD.osmNode({ id: 'z', loc: [2, 1] });

            graph = iD.coreGraph([
                a, b, c, d, u, y, w, z,
                iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
                iD.osmWay({ id: 'another', nodes: ['y', 'w', 'u', 'z', 'y'] }),
                iD.osmWay({ id: 'cutline', nodes: ['b', 'd'] }),
                iD.osmRelation({ id: 'rel', tags: { type: 'whatever' }, members: [
                    { id: 'area', type: 'way' },
                    { id: 'another', type: 'way' }
                ]})
            ]);
        });

        describe('#not_available', function () {

            it('for selected cutline', function () {
                expect(iD.operationSplice(fakeContext, [ 'cutline' ]).available()).to.be.not.ok;
            });

            it('for selected cutline and area', function () {
                expect(iD.operationSplice(fakeContext, [ 'cutline', 'area' ]).available()).to.be.not.ok;
                expect(iD.operationSplice(fakeContext, [ 'area', 'cutline' ]).available()).to.be.not.ok;
            });
        });
    });
});
