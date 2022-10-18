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
            //    |    \ |
            //    a <--- d
            //
            //    Area a-b-c-d-a
            //    Cut line b-d

            var a = iD.osmNode({ id: 'a', loc: [0, 0] });
            var b = iD.osmNode({ id: 'b', loc: [0, 1] });
            var c = iD.osmNode({ id: 'c', loc: [1, 1] });
            var d = iD.osmNode({ id: 'd', loc: [0, 1] });

            graph = iD.coreGraph([
                a, b, c, d,
                iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'], tags: { area: 'yes' } }),
                iD.osmWay({ id: 'cutline', nodes: ['b', 'd'] })
            ]);
        });

        describe('#disabled', function () {

            it('is not available for no selected ids', function () {
                expect(iD.operationSplice(fakeContext, []).available()).to.be.not.ok;
            });

            it('is not available for selected area', function () {
                expect(iD.operationSplice(fakeContext, [ 'area' ]).available()).to.be.not.ok;
            });

            it('is not available for selected cutline, area and some node', function () {
                expect(iD.operationSplice(fakeContext, [ 'area', 'cutline', 'a' ]).available()).to.be.not.ok;
            });

            it('is not available for selected area and node', function () {
                expect(iD.operationSplice(fakeContext, [ 'area', 'b' ]).available()).to.be.not.ok;
            });

            it('is not available for selected cutline\'s node', function () {
                expect(iD.operationSplice(fakeContext, [ 'b', 'd' ]).available()).to.be.not.ok;
            });

            it('is not available for selected area and cutline\'s node', function () {
                expect(iD.operationSplice(fakeContext, [ 'area', 'b', 'd' ]).available()).to.be.not.ok;
            });
        });

        describe('#available', function () {

            it('is available for selected cutline', function () {
                expect(iD.operationSplice(fakeContext, [ 'cutline' ]).available()).to.be.ok;
            });

            it('is available for selected cutline and area', function () {
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
            //    |    \ |
            //    a <--- d
            //
            //    Loop (closed way but not area) a-b-c-d-a
            //    Cut line b-d

            var a = iD.osmNode({ id: 'a', loc: [0, 0] });
            var b = iD.osmNode({ id: 'b', loc: [0, 1] });
            var c = iD.osmNode({ id: 'c', loc: [1, 1] });
            var d = iD.osmNode({ id: 'd', loc: [0, 1] });

            graph = iD.coreGraph([
                a, b, c, d,
                iD.osmWay({ id: 'loop', nodes: ['a', 'b', 'c', 'd', 'a'] }),
                iD.osmWay({ id: 'cutline', nodes: ['b', 'd'], tags: { interesting: 'yes' } })
            ]);
        });

        describe('#disabled', function () {

            it('is not available for selected cutline', function () {
                expect(iD.operationSplice(fakeContext, [ 'cutline' ]).available()).to.be.not.ok;
            });

            it('is available for selected cutline and area', function () {
                expect(iD.operationSplice(fakeContext, [ 'cutline', 'loop' ]).available()).to.be.not.ok;
                expect(iD.operationSplice(fakeContext, [ 'loop', 'cutline' ]).available()).to.be.not.ok;
            });

            it('is not available for selected area', function () {
                expect(iD.operationSplice(fakeContext, [ 'loop' ]).available()).to.be.not.ok;
            });
        });
    });
});
