@isTest
global class ExampleCalloutMock implements HttpCalloutMock{
    private Id saId;
    
    global ExampleCalloutMock(Id saId){
        this.saId = saId;
    }
    global HttpResponse respond(HTTPRequest req){
        HttpResponse res = new HttpResponse();
        res.setStatus('OK');
        res.setStatusCode(200);
        
        res.setHeader('Content-Type', 'application/json;charset=UTF-8');
        //res.setBody('{"input":[{"entityId" : "' + saId + '"}]}');
        res.setBody('{"inputs" : [{"contentVersionId":"' + saId + '","entityId":"' + saId + '"}]}');
        //res.setBody('GREAT SCOTT');
        return res;
    }
}