// todo: operation #disabled tests since it does a lot of checks

describe('iD.actionSplice', function () {

    describe('#disabled', function () {

        // todo: check valid cases to not be disabled

        it('disabled when cutline has tags', function () {
            //
            // Situation:
            //    b ---> c
            //    ^ \    |
            //    |    \ |
            //    a <--- d
            //
            //    Area a-b-c-d-a
            //    Cut line b-d; has tags

            var a = iD.osmNode({ id: 'a', loc: [0, 0] });
            var b = iD.osmNode({ id: 'b', loc: [0, 1] });
            var c = iD.osmNode({ id: 'c', loc: [1, 1] });
            var d = iD.osmNode({ id: 'd', loc: [0, 1] });
            var graph = iD.coreGraph([
                a, b, c, d,
                iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
                iD.osmWay({ id: 'cutline', nodes: ['b', 'd'], tags: { interesting: 'yes' } })
            ]);

            expect(iD.actionSplice(['area', 'cutline']).disabled(graph)).to.equal('cutline_tagged');
        });

        it('disabled when cutline\'s inner node has tags', function () {
            //
            // Situation:
            //    b ------> c
            //    ^  \      |
            //    |    x    |
            //    |      \  v
            //    a <------ d
            //
            //    Area a-b-c-d-a
            //    Cut line b-x-d
            //    Node x has tags

            var a = iD.osmNode({ id: 'a', loc: [0, 0] });
            var b = iD.osmNode({ id: 'b', loc: [0, 2] });
            var c = iD.osmNode({ id: 'c', loc: [2, 2] });
            var d = iD.osmNode({ id: 'd', loc: [0, 2] });
            var x = iD.osmNode({ id: 'x', loc: [1, 1], tags: { interesting: 'yes' } });
            var graph = iD.coreGraph([
                a, b, c, d, x,
                iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
                iD.osmWay({ id: 'cutline', nodes: ['b', 'x', 'd'] })
            ]);

            expect(iD.actionSplice(['area', 'cutline']).disabled(graph)).to.equal('cutline_nodes_tagged');
        });

        it('disabled when cutline\'s inner node connects to other ways', function () {
            //
            // Situation:
            //    b --------> c
            //    ^ \         |
            //    |   \   y   |
            //    |     x     |
            //    |       \   |
            //    |         \ v
            //    a <-------- d
            //
            //    Area a-b-c-d-a
            //    Cut line b-x-d
            //    Way x-y

            var a = iD.osmNode({ id: 'a', loc: [0, 0] });
            var b = iD.osmNode({ id: 'b', loc: [0, 2] });
            var c = iD.osmNode({ id: 'c', loc: [2, 2] });
            var d = iD.osmNode({ id: 'd', loc: [0, 2] });
            var x = iD.osmNode({ id: 'x', loc: [1, 1] });
            var y = iD.osmNode({ id: 'y', loc: [1.5, 1.5] });
            var graph = iD.coreGraph([
                a, b, c, d, x,
                iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
                iD.osmWay({ id: 'cutline', nodes: ['b', 'x', 'd'] }),
                iD.osmWay({ id: 'other', nodes: ['x', 'y'] })
            ]);

            expect(iD.actionSplice(['area', 'cutline']).disabled(graph)).to.equal('cutline_connected_to_other');
        });

        it('disabled when cutline\'s inner node connect to parent way', function () {
            //
            // Situation:
            //    b -----> c
            //    ^  \     |
            //    |     \  |
            //    |        x
            //    |     /  |
            //    |  /     v
            //    a <----- d
            //
            //    Area a-b-c-x-d-a
            //    Cut line b-x-d
            //    Node x is shared
            //

            var a = iD.osmNode({ id: 'a', loc: [0, 0] });
            var b = iD.osmNode({ id: 'b', loc: [0, 4] });
            var c = iD.osmNode({ id: 'c', loc: [2, 4] });
            var x = iD.osmNode({ id: 'x', loc: [2, 2] });
            var d = iD.osmNode({ id: 'd', loc: [0, 2] });
            var graph = iD.coreGraph([
                a, b, c, d, x,
                iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'x', 'd', 'a'] }),
                iD.osmWay({ id: 'cutline', nodes: ['b', 'x', 'a'] })
            ]);

            expect(iD.actionSplice(['area', 'cutline']).disabled(graph)).to.equal('cutline_multiple_connection');
        });

        it('disabled when cutline\'s inner node is outside the parent way', function () {
            //
            // Situation:
            //
            //           __--- x
            //     ---```     /
            //    b ---> c   /
            //    ^      |  /
            //    |      | /
            //    a <--- d
            //
            //    Area a-b-c-d-a
            //    Cut line b-x-d
            //    Node x is outside area
            //

            var a = iD.osmNode({ id: 'a', loc: [0, 0] });
            var b = iD.osmNode({ id: 'b', loc: [0, 1] });
            var c = iD.osmNode({ id: 'c', loc: [1, 1] });
            var d = iD.osmNode({ id: 'd', loc: [0, 1] });
            var x = iD.osmNode({ id: 'x', loc: [2, 2] });
            var graph = iD.coreGraph([
                a, b, c, d, x,
                iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
                iD.osmWay({ id: 'cutline', nodes: ['b', 'x', 'd'] })
            ]);

            expect(iD.actionSplice(['area', 'cutline']).disabled(graph)).to.equal('cutline_outside_area');
        });

        // todo: cutline in relation
        // todo: cutline node in relation
        // todo: cutline intersect inner member

    });


    it('splices a square', function () {
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
        var graph = iD.coreGraph([
            a, b, c, d,
            iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
            iD.osmWay({ id: 'cutline', nodes: ['b', 'd'] })
        ]);

        var graph1 = iD.actionSplice(['area', 'cutline'], ['new'])(graph);
        expect(graph1.hasEntity('cutline')).to.be.undefined;
        expect(graph1.entity('area').nodes).to.eql(['d', 'a', 'b', 'd']);
        expect(graph1.entity('new').nodes).to.eql(['b', 'c', 'd', 'b']);

        var graph2 = iD.actionSplice(['cutline'], ['new'])(graph);
        expect(graph2.hasEntity('cutline')).to.be.undefined;
        expect(graph2.entity('area').nodes).to.eql(['d', 'a', 'b', 'd']);
        expect(graph2.entity('new').nodes).to.eql(['b', 'c', 'd', 'b']);
    });

    it('splices with an extra node', function () {
        //
        // Situation:
        //    b ------> c
        //    ^  \      |
        //    |    x    |
        //    |      \  v
        //    a <------ d
        //
        //    Area a-b-c-d-a
        //    Cut line b-x-d

        var a = iD.osmNode({ id: 'a', loc: [0, 0] });
        var b = iD.osmNode({ id: 'b', loc: [0, 2] });
        var c = iD.osmNode({ id: 'c', loc: [2, 2] });
        var d = iD.osmNode({ id: 'd', loc: [0, 2] });
        var x = iD.osmNode({ id: 'x', loc: [1, 1] });
        var graph = iD.coreGraph([
            a, b, c, d, x,
            iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
            iD.osmWay({ id: 'cutline', nodes: ['b', 'x', 'd'] })
        ]);

        var graph1 = iD.actionSplice(['area', 'cutline'], ['new'])(graph);
        expect(graph1.hasEntity('cutline')).to.be.undefined;
        expect(graph1.entity('area').nodes).to.eql(['d', 'a', 'b', 'x', 'd']);
        expect(graph1.entity('new').nodes).to.eql(['b', 'c', 'd', 'x', 'b']);

        var graph2 = iD.actionSplice(['cutline'], ['new'])(graph);
        expect(graph2.hasEntity('cutline')).to.be.undefined;
        expect(graph2.entity('area').nodes).to.eql(['d', 'a', 'b', 'x', 'd']);
        expect(graph2.entity('new').nodes).to.eql(['b', 'c', 'd', 'x', 'b']);
    });

    it('splices when another way terminates at node', function () {
        //
        // Situation:
        //    b ---> c
        //    ^ \    |
        //    |    \ |
        //    a <--- d ---> y
        //
        //    Area a-b-c-d-a
        //    Way d-y
        //    Cut line b-d

        var a = iD.osmNode({ id: 'a', loc: [0, 0] });
        var b = iD.osmNode({ id: 'b', loc: [0, 1] });
        var c = iD.osmNode({ id: 'c', loc: [1, 1] });
        var d = iD.osmNode({ id: 'd', loc: [0, 1] });
        var y = iD.osmNode({ id: 'y', loc: [2, 0] });
        var graph = iD.coreGraph([
            a, b, c, d, y,
            iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
            iD.osmWay({ id: 'cutline', nodes: ['b', 'd'] }),
            iD.osmWay({ id: 'Y', nodes: ['d', 'y'] })
        ]);

        var graph1 = iD.actionSplice(['area', 'cutline'], ['new'])(graph);
        expect(graph1.hasEntity('cutline')).to.be.undefined;
        expect(graph1.entity('area').nodes).to.eql(['d', 'a', 'b', 'd']);
        expect(graph1.entity('new').nodes).to.eql(['b', 'c', 'd', 'b']);

        var graph2 = iD.actionSplice(['cutline'], ['new'])(graph);
        expect(graph2.hasEntity('cutline')).to.be.undefined;
        expect(graph2.entity('area').nodes).to.eql(['d', 'a', 'b', 'd']);
        expect(graph2.entity('new').nodes).to.eql(['b', 'c', 'd', 'b']);
    });

    it('splices when another way passes through a node', function () {
        //
        // Situation:
        //    b ---> c
        //    ^ \    |
        //    |    \ |
        //    a <--- d ---> y
        //           |
        //           u
        //
        //    Area a-b-c-d-a
        //    Way u-d-y
        //    Cut line b-d

        var a = iD.osmNode({ id: 'a', loc: [0, 0] });
        var b = iD.osmNode({ id: 'b', loc: [0, 1] });
        var c = iD.osmNode({ id: 'c', loc: [1, 1] });
        var d = iD.osmNode({ id: 'd', loc: [0, 1] });
        var y = iD.osmNode({ id: 'y', loc: [2, 0] });
        var u = iD.osmNode({ id: 'u', loc: [1, -1] });
        var graph = iD.coreGraph([
            a, b, c, d, y, u,
            iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
            iD.osmWay({ id: 'cutline', nodes: ['b', 'd'] }),
            iD.osmWay({ id: 'Y', nodes: ['u', 'd', 'y'] })
        ]);

        var graph1 = iD.actionSplice(['area', 'cutline'], ['new'])(graph);
        expect(graph1.hasEntity('cutline')).to.be.undefined;
        expect(graph1.entity('area').nodes).to.eql(['d', 'a', 'b', 'd']);
        expect(graph1.entity('new').nodes).to.eql(['b', 'c', 'd', 'b']);

        var graph2 = iD.actionSplice(['cutline'], ['new'])(graph);
        expect(graph2.hasEntity('cutline')).to.be.undefined;
        expect(graph2.entity('area').nodes).to.eql(['d', 'a', 'b', 'd']);
        expect(graph2.entity('new').nodes).to.eql(['b', 'c', 'd', 'b']);
    });

    it('splices when another area terminates at node', function () {
        //
        // Situation:
        //    b ---> c      u
        //    ^ \    |    / |
        //    |    \ |  /   |
        //    a <--- d ---> y
        //
        //    Area a-b-c-d-a
        //    Area d-y-u-d
        //    Cut line b-d

        var a = iD.osmNode({ id: 'a', loc: [0, 0] });
        var b = iD.osmNode({ id: 'b', loc: [0, 1] });
        var c = iD.osmNode({ id: 'c', loc: [1, 1] });
        var d = iD.osmNode({ id: 'd', loc: [0, 1] });
        var y = iD.osmNode({ id: 'y', loc: [2, 0] });
        var u = iD.osmNode({ id: 'u', loc: [2, 1] });
        var graph = iD.coreGraph([
            a, b, c, d, y, u,
            iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
            iD.osmWay({ id: 'cutline', nodes: ['b', 'd'] }),
            iD.osmWay({ id: 'Y', nodes: ['d', 'y', 'u', 'd'] })
        ]);

        var graph1 = iD.actionSplice(['area', 'cutline'], ['new'])(graph);
        expect(graph1.hasEntity('cutline')).to.be.undefined;
        expect(graph1.entity('area').nodes).to.eql(['d', 'a', 'b', 'd']);
        expect(graph1.entity('new').nodes).to.eql(['b', 'c', 'd', 'b']);

        var graph2 = iD.actionSplice(['cutline'], ['new'])(graph);
        expect(graph2.hasEntity('cutline')).to.be.undefined;
        expect(graph2.entity('area').nodes).to.eql(['d', 'a', 'b', 'd']);
        expect(graph2.entity('new').nodes).to.eql(['b', 'c', 'd', 'b']);
    });

    it('splices when another way connects to both nodes', function () {
        //
        // Situation:
        //    w-------------u
        //    |             |
        //    b ---> c      |
        //    ^ \    |      |
        //    |    \ |      |
        //    a <--- d ---> y
        //
        //    Area a-b-c-d-a
        //    Way d-y-u-w-b
        //    Cut line b-d

        var a = iD.osmNode({ id: 'a', loc: [0, 0] });
        var b = iD.osmNode({ id: 'b', loc: [0, 1] });
        var c = iD.osmNode({ id: 'c', loc: [1, 1] });
        var d = iD.osmNode({ id: 'd', loc: [0, 1] });
        var y = iD.osmNode({ id: 'y', loc: [2, 0] });
        var u = iD.osmNode({ id: 'u', loc: [2, 2] });
        var w = iD.osmNode({ id: 'w', loc: [0, 2] });
        var graph = iD.coreGraph([
            a, b, c, d, y, u, w,
            iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
            iD.osmWay({ id: 'cutline', nodes: ['b', 'd'] }),
            iD.osmWay({ id: 'Y', nodes: ['d', 'y', 'u', 'w', 'b'] })
        ]);

        var graph1 = iD.actionSplice(['area', 'cutline'], ['new'])(graph);
        expect(graph1.hasEntity('cutline')).to.be.undefined;
        expect(graph1.entity('area').nodes).to.eql(['d', 'a', 'b', 'd']);
        expect(graph1.entity('new').nodes).to.eql(['b', 'c', 'd', 'b']);

        var graph2 = iD.actionSplice(['cutline'], ['new'])(graph);
        expect(graph2.hasEntity('cutline')).to.be.undefined;
        expect(graph2.entity('area').nodes).to.eql(['d', 'a', 'b', 'd']);
        expect(graph2.entity('new').nodes).to.eql(['b', 'c', 'd', 'b']);
    });

    it('splices explicitly when another area connects to both nodes', function () {
        //
        // Situation:
        //    w-------------u
        //    |             |
        //    b ---> c      |
        //    ^ \    |      |
        //    |    \ |      |
        //    a <--- d ---> y
        //
        //    Area a-b-c-d-a
        //    Area a-b-w-u-y-d-a
        //    Cut line b-d

        var a = iD.osmNode({ id: 'a', loc: [0, 0] });
        var b = iD.osmNode({ id: 'b', loc: [0, 1] });
        var c = iD.osmNode({ id: 'c', loc: [1, 1] });
        var d = iD.osmNode({ id: 'd', loc: [0, 1] });
        var y = iD.osmNode({ id: 'y', loc: [2, 0] });
        var u = iD.osmNode({ id: 'u', loc: [2, 2] });
        var w = iD.osmNode({ id: 'w', loc: [0, 2] });
        var graph = iD.coreGraph([
            a, b, c, d, y, u, w,
            iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
            iD.osmWay({ id: 'cutline', nodes: ['b', 'd'] }),
            iD.osmWay({ id: 'Y', nodes: ['a', 'b', 'w', 'u', 'y', 'd', 'a'] })
        ]);

        graph = iD.actionSplice(['area', 'cutline'], ['new'])(graph);
        expect(graph.hasEntity('cutline')).to.be.undefined;
        expect(graph.entity('area').nodes).to.eql(['d', 'a', 'b', 'd']);
        expect(graph.entity('new').nodes).to.eql(['b', 'c', 'd', 'b']);
    });

    it('splices an area with unnatural split layout', function () {
        //
        // Situation:
        //    b ---> c ---> d ------------------------> e
        //    ^      .                                  |
        //    |      v                                  v
        //    a <--- h <--- g <------------------------ f
        //
        //    Area a-b-c-d-e-f-a
        //    Cut line b-e
        //
        // Expected result:
        //    b ---> c ---> d ------------------------> e
        //    ^      |\                                 |
        //    |     \|                                  v
        //    a <--- h <--- g <------------------------ f
        //
        //    Two areas: a-b-c-h-a and c-d-e-f-g-h
        //    Note that we don't care which area is which
        //    Note that we don't care about the order of the nodes

        var a = iD.osmNode({ id: 'a', loc: [0, 0] });
        var b = iD.osmNode({ id: 'b', loc: [0, 1] });
        var c = iD.osmNode({ id: 'c', loc: [1, 1] });
        var d = iD.osmNode({ id: 'd', loc: [2, 1] });
        var e = iD.osmNode({ id: 'e', loc: [8, 1] });
        var f = iD.osmNode({ id: 'f', loc: [8, 0] });
        var g = iD.osmNode({ id: 'g', loc: [2, 0] });
        var h = iD.osmNode({ id: 'h', loc: [1, 0] });
        var graph = iD.coreGraph([
            a, b, c, d, e, f, g, h,
            iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'a'] }),
            iD.osmWay({ id: 'cutline', nodes: ['c', 'h'] })
        ]);

        graph = iD.actionSplice(['area', 'cutline'], ['A', 'B'])(graph);

        // Cut line must be deleted
        expect(graph.hasEntity('cutline')).to.be.undefined;

        // Because split action can make 3 ways from a single area
        // and we don't know which ways will survive the subsequent combination,
        // we have to check for any of the 3 possible combinations.
        // So, first, make sure that exactly 2 of 3 areas survived

        var areaA = graph.hasEntity('area');
        var areaB = graph.hasEntity('A');
        var areaC = graph.hasEntity('B');

        expect(
            areaA && areaB && !areaC ||
            areaA && !areaB && areaC ||
            !areaA && areaB && areaC
        );

        // Then pick the two areas that survived

        var area1;
        var area2;

        if (!areaC) {
            area1 = areaA;
            area2 = areaB;
        } else if (!areaB) {
            area1 = areaA;
            area2 = areaC;
        } else { // !areaA
            area1 = areaB;
            area2 = areaC;
        }

        expect(area1.isClosed()).to.be.true;
        expect(area2.isClosed()).to.be.true;

        // Then choose which is the shorter and which is the longer one

        var areaShort;
        var areaLong;

        if (area1.nodes.length === 7) {
            areaShort = area2;
            areaLong = area1;
        } else {
            areaShort = area1;
            areaLong = area2;
        }

        expect(areaShort.nodes.length).to.equal(5);
        expect(areaLong.nodes.length).to.equal(7);

        expect(areaShort.nodes).to.include.members(['a', 'b', 'c', 'h']);
        expect(areaLong.nodes).to.include.members(['c', 'd', 'e', 'f', 'g', 'h']);
        // todo: how do I assert order without caring about the starting element
    });

    it('splices when a cutline\'s terminal node has tags', function () {
        //
        // Situation:
        //    b ---> c
        //    ^ \    |
        //    |    \ |
        //    a <--- d
        //
        //    Area a-b-c-d-a
        //    Cut line b-d
        //    Node d has tags

        var a = iD.osmNode({ id: 'a', loc: [0, 0] });
        var b = iD.osmNode({ id: 'b', loc: [0, 1] });
        var c = iD.osmNode({ id: 'c', loc: [1, 1] });
        var d = iD.osmNode({ id: 'd', loc: [0, 1], tags: { interesting: 'yes' } });
        var graph = iD.coreGraph([
            a, b, c, d,
            iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
            iD.osmWay({ id: 'cutline', nodes: ['b', 'd'] })
        ]);

        var graph1 = iD.actionSplice(['area', 'cutline'], ['new'])(graph);
        expect(graph1.hasEntity('cutline')).to.be.undefined;
        expect(graph1.entity('area').nodes).to.eql(['d', 'a', 'b', 'd']);
        expect(graph1.entity('new').nodes).to.eql(['b', 'c', 'd', 'b']);

        var graph2 = iD.actionSplice(['cutline'], ['new'])(graph);
        expect(graph2.hasEntity('cutline')).to.be.undefined;
        expect(graph2.entity('area').nodes).to.eql(['d', 'a', 'b', 'd']);
        expect(graph2.entity('new').nodes).to.eql(['b', 'c', 'd', 'b']);
    });
});
