describe('iD.actionSplice', function () {

    describe('#disabled', function () {

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

        it('disabled when cutline in in a relation', function () {
            //
            // Situation:
            //    b ---> c
            //    ^ \    |
            //    |    \ |
            //    a <--- d
            //
            //    Area a-b-c-d-a
            //    Cut line b-d; in is relation

            var a = iD.osmNode({ id: 'a', loc: [0, 0] });
            var b = iD.osmNode({ id: 'b', loc: [0, 1] });
            var c = iD.osmNode({ id: 'c', loc: [1, 1] });
            var d = iD.osmNode({ id: 'd', loc: [0, 1] });
            var graph = iD.coreGraph([
                a, b, c, d,
                iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
                iD.osmWay({ id: 'cutline', nodes: ['b', 'd'] }),
                iD.osmRelation({ id: 'relation', members: [ { id: 'cutline', type: 'way' } ]})
            ]);

            expect(iD.actionSplice(['area', 'cutline']).disabled(graph)).to.equal('cutline_in_relation');
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

        it('disabled when cutline\'s inner node is in a relation', function () {
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
            //    Node x is in relation

            var a = iD.osmNode({ id: 'a', loc: [0, 0] });
            var b = iD.osmNode({ id: 'b', loc: [0, 2] });
            var c = iD.osmNode({ id: 'c', loc: [2, 2] });
            var d = iD.osmNode({ id: 'd', loc: [0, 2] });
            var x = iD.osmNode({ id: 'x', loc: [1, 1] });
            var graph = iD.coreGraph([
                a, b, c, d, x,
                iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
                iD.osmWay({ id: 'cutline', nodes: ['b', 'x', 'd'] }),
                iD.osmRelation({ id: 'relation', members: [ { id: 'x', type: 'way' } ]})
            ]);

            expect(iD.actionSplice(['area', 'cutline']).disabled(graph)).to.equal('cutline_nodes_in_relation');
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
                a, b, c, d, x, y,
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

        it('disabled when cutline intersects with another way in parent way\'s multipolygon relation', function () {
            //
            // Situation:
            //    b ------------> c
            //    ^ \             |
            //    |   \           |
            //    |  u -\ ---- w  |
            //    |  |    \    |  |
            //    |  y -----\- z  |
            //    |           \   |
            //    |             \ |
            //    a <------------ d
            //
            //    Area a-b-c-d-a
            //    Cut line b-d
            //    Inner area y-u-w-z-y
            //    Relation containing Area and Inner area

            var a = iD.osmNode({ id: 'a', loc: [0, 0] });
            var b = iD.osmNode({ id: 'b', loc: [0, 5] });
            var c = iD.osmNode({ id: 'c', loc: [5, 5] });
            var d = iD.osmNode({ id: 'd', loc: [5, 0] });
            var y = iD.osmNode({ id: 'y', loc: [1, 2] });
            var u = iD.osmNode({ id: 'u', loc: [1, 3] });
            var w = iD.osmNode({ id: 'w', loc: [4, 3] });
            var z = iD.osmNode({ id: 'z', loc: [4, 2] });
            var graph = iD.coreGraph([
                a, b, c, d, y, u, w, z,
                iD.osmWay({ id: 'area', nodes: ['a', 'b', 'c', 'd', 'a'] }),
                iD.osmWay({ id: 'cutline', nodes: ['b', 'd'] }),
                iD.osmWay({ id: 'inside', nodes: ['y', 'u', 'w', 'z', 'y'] }),
                iD.osmRelation({ id: 'rel', tags: { type: 'multipolygon' }, members: [
                    { id: 'area', type: 'way' },
                    { id: 'inside', type: 'way' }
                ]})
            ]);

            expect(iD.actionSplice(['area', 'cutline']).disabled(graph)).to.equal('cutline_intersects_inner_members');
        });

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
