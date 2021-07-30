const { PromiseF } = require('../utils/helpers');
var fetchClientsMock = () =>
  new PromiseF((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, name: 'jim', age: 29 },
        { id: 2, name: 'jane', age: 25 },
      ]);
    }, 1000);
  });

var clientRepository = {
  getById: (id) =>
    fetchClientsMock().map((clients) => clients.filter((c) => c.id == id)), //promise of a filtered array matching id
};

var clientNameById = (id) => clientRepository.getById(id).map((x) => x[0].name); //might throw exception  if array is empty
//  we will deal with this in the next section

clientNameById(1).then((x) => console.log(`the client name is ${x}`));
