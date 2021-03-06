# Basic Sample Hardhat Project

Проект реализует логику проведения голосования на основе смарт-контракта.
Для работы необходимо создать и заолнить .env файл.

Упрощенный процесс организации голосования:
- развертывается контракт
- вызывается метод создания нового голосования
- принимаются голоса за кандидатов в течение 3 дней
- закрывается голосование, победителю голосования отправляется выигрыш

### Пример работы с использованием локальной сети
#####Разворачиваем
```shell
npx hardhat clean 
npx hardhat compile 
npx hardhat run scripts/deploy.js --network localhost
```
#####Вызываем команды для голосования
```shell
# Создаем новое голосование (всегда с 3 участниками)
npx hardhat election-create --campaign <campaignName> --candidate1 <candidateAddress> --candidate2 <candidateAddress> --candidate3 <candidateAddress> --network localhost
# Выводим в консоль адреса кандидатов голосования
npx hardhat candidates --campaign <campaignName> --network localhost
# Выводим в консоль дату окончания голосования (в timestamp) и общее количество голосов
npx hardhat election-info --campaign <campaignName> --network localhost
# Голосуем за кандидата
npx hardhat vote --campaign <campaignName> --candidate <candidateNumber> --network localhost
# Выводим в консоль сумму общей комиссии
npx hardhat withdraw-balance --network localhost
# Переводим сумму общей комиссии владельцу контракта
npx hardhat withdraw --network localhost
```

Список всех команд находится в папке tasks 
Для исполнения команд от другого аккаунта, необходимо передать параметр --account (работает не для всех комманд)  

Особенности реализации:
- Кандидаты добавляются только при создании нового голосования
- Кандидатов всегда 3
- Каждое голосование стоит 0.01 eth
- За голосование берется комиссия 0.001 eth
- Стоимость комиссии включена в стоимость голосования
- После 3 дней с начала голосования (его создания), новые голоса не принимаются
- Для завершения голосования необходимо напрямую вызвать данную транзакцию
- При завершении голосования, победителю отправляется выигрыш (за вычетом комиссии)
- Победитель только один, даже если несколько кандидатов набрали одинаковое количество голосов
- Переменная CONTRACT_ADDRESS в .env содержит адрес развернутого контракта с голосованием (появится в консоле после деплоя)
