$(function(){
    var form;
    var formNameList = [{"name":"name"},{"name":"member"},{"name":"isColorGroup"},{"name":"backgroundColor"},{"name":"fontColor"}];
    _val.pageFun.editGroup = {
        onload:function(){
            form = $("#formEditGroup");
        },onunload:function(){
        
        },updateGroup:function(){

        },searchGroup:function(){

        },convertColor:function(type){
            var el = {},value = {};
            var max,min;
            ["r","g","b","h","s","l"].forEach(function(key){
                el[key] = form.find('[name="color_sample_' + key +'"]');
                el["range_"+key] = form.find('[name="color_sample_' + key +'_range"]');
                value[key] = 0;
            });
            if(type === "rgb"){
                ["r","g","b"].forEach(function(key){
                    value[key] = el[key].val();
                });
                max = Math.max(value.r,value.g,value.b);
                min = Math.min(value.r,value.g,value.b);
                if(max === min){
                    value.h = 0;
                }else if(value.r === max){
                    value.h = Math.floor(60 * (value.g - value.b) / (max - min));
                }else if(value.g === max){
                    value.h = Math.floor(60 * (value.b - value.r) / (max - min) + 120);
                }else if(value.b === max){
                    value.h = Math.floor(60 * (value.r - value.g) / (max - min) + 240);
                }
                while(value.h < 0){
                    value.h += 360;
                }
                value.h = value.h % 360;
                var cnt = (max + min)/2;
                if(cnt < 128){
                    value.s = Math.floor(100 * (max - min)/(max + min));
                }else{
                    value.s = Math.floor(100 * (max - min)/(510 - max - min));
                }
                value.l = Math.floor(100*cnt/255);

            }else if(type === "hsl"){
                ["h","s","l"].forEach(function(key){
                    value[key] = el[key].val();
                });
                if(value.l<50){
                    max = Math.floor(2.55*value.l*(1 + value.s/100));
                    min = Math.floor(2.55*value.l*(1 - value.s/100));
                }else{
                    max = Math.floor(2.55*(value.l*(1 - value.s/100) + value.s));
                    min = Math.floor(2.55*(value.l*(1 + value.s/100) - value.s));
                }
                if(value.h < 60*1){
                    value.r = max;
                    value.g = Math.floor((value.h/60)*(max-min) + min);
                    value.b = min;
                }else if(value.h < 60*2){
                    value.r = Math.floor(((120-value.h)/60)*(max-min) + min);
                    value.g = max;
                    value.b = min;
                }else if(value.h < 60*3){
                    value.r = min;
                    value.g = max;
                    value.b = Math.floor(((value.h-120)/60)*(max-min) + min);
                }else if(value.h < 60*4){
                    value.r = min;
                    value.g = Math.floor(((240-value.h)/60)*(max-min) + min);
                    value.b = max;
                }else if(value.h < 60*5){
                    value.r = Math.floor(((value.h-240)/60)*(max-min) + min);
                    value.g = min;
                    value.b = max;
                }else{
                    value.r = max;
                    value.g = min;
                    value.b = Math.floor(((360-value.h)/60)*(max-min) + min);
                }
            }
            ["r","g","b","h","s","l"].forEach(function(key){
                el[key].val(value[key]);
                el["range_"+key].val(value[key]);
            });
            var r16,g16,b16;
            r16 = (+el.r.val()).toString(16);
            g16 = (+el.g.val()).toString(16);
            b16 = (+el.b.val()).toString(16);
            if(r16.length === 1) r16 = "0" + r16;
            if(g16.length === 1) g16 = "0" + g16;
            if(b16.length === 1) b16 = "0" + b16;
            form.find('[name="color_code"]').val("#" + r16 + g16 + b16);
            form.find('[name="color_sample"]').css("background",form.find('[name="color_code"]').val());
        }
    };
});