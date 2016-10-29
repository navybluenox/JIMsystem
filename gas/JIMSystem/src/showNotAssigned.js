$(function(){
    var pageFun;
    var form,formGroup;
    _val.pageFun.showNotAssigned = {
        onload:function(){
            _val.server.loadData("user");
            _val.server.loadData("workList");
            _val.server.loadData("workAssign");
            _val.server.loadData("userGroup");
            _val.server.loadData("workGroup");
            pageFun = _val.pageFun.showNotAssigned;
            form = $("#formWorkList");
            formGroup = $("#formGroup");
        },onunload:function(){
        },showWorkList:function(){
            var result = $("#formWorkList_result");
            result.children().remove();

            result.append('<table class="tableform"><tbody></tbody></table>');

            WorkList.getNotAssigned().forEach(function(obj){
                var workList = obj.workList;
                var detail = workList.getValue("@detail");
                var indexes = obj.index;
                var trs = $(indexes.map(function(index,i){
                    return '<tr>' + repeatString('<td></td>',(i === 0 ? 3 : 2)) + '</tr>';
                }).join("")).appendTo(result.find("table.tableform > tbody"));
                trs.eq(0).children("td:first-child").text(workList.getValue("name")).attr("rowSpan",indexes.length);
                indexes.forEach(function(index,i){
                    var td = trs.eq(i).children("td:last-child");
                    td.prev("td").text(detail[index].start.toString());
                    var start = detail[index].start;
                    var end = start.copy().addTimeUnit(detail[index].number.length);
                    var div = $("<div></div>").css({"overflow":"auto","max-width":$(window).width()*0.5}).appendTo(td);
                    $('<input type="button" value="人割を表示する">').appendTo(div).on("click",function(){
                        div.children().remove();
                        div.append(workList.getShiftTableAsElement(start,end));
                    });
                });
            });
            result.find("table.tableform > tbody > tr > td:first-child").css("background","transparent");
        }
    };
});
