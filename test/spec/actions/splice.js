describe('iD.actionSplice', function () {

    describe('#disabled', function () {

    });


    it('splices an area', function () {
        //
        // Situation:
        //    b ---> c ---> d ---> e
        //    ^      .             |
        //    |      v             v
        //    a <--- h <--- g <--- f
        //
        //    Area a-b-c-d-e-f-a
        //    Cut line b-e
        //
        // Expected result:
        //    b ---> c ---> d ---> e
        //    ^      |\            |
        //    |     \|             v
        //    a <--- h <--- g <--- f
        //
        //    Two areas: a-b-c-h-a and c-d-e-f-g-h
        //    Note that we don't care which area is which
        //    Note that we don't care about the order of the nodes

        var a = iD.osmNode({ id: 'a', loc: [0, 0] });
        var b = iD.osmNode({ id: 'b', loc: [0, 1] });
        var c = iD.osmNode({ id: 'c', loc: [1, 1] });
        var d = iD.osmNode({ id: 'd', loc: [2, 1] });
        var e = iD.osmNode({ id: 'e', loc: [3, 1] });
        var f = iD.osmNode({ id: 'f', loc: [3, 0] });
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
    });
});
