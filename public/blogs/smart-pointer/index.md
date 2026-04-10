> * 智能指针本质上是一个原始指针的包装，可以实现**自动管理内存空间**的功能
> * 分为三类，分别为`unique_ptr`、`shared_ptr`和`weak_ptr`，位于标准库`memory`中

**公共代码**

```c++
#include <iostream>
#include <memory> // 智能指针使用的库

class Entity {
public:
    Entity() {
        std::cout << "Created Entity!" << std::endl;
    }
    ~Entity() {
        std::cout << "Destroyed Entity!" << std::endl;
    }
    
    void Print() {
        
    }
};
```

## std::unique_ptr

`unique_ptr`是作用域指针，超出作用域时会被销毁，然后自动调用`delete`释放指向的内存。

* `unique_ptr`**不允许复制**，这样会出现两个指针指向同一块内存的情况，其中一个销毁后会产生野指针
* `unique_ptr`的构造函数是被`explicit`修饰的，**不支持隐式转换**
* 低开销，只是一个栈上创建的对象，所以在作用域结束时会被销毁，同时调用`delete`释放内存

```c++
int main() {
    {
        // std::unique_ptr<Entity> entity = new Entity(); // 不支持隐式转换
        // std::unique_ptr<Entity> entity(new Entity()); // 发生异常时new的内存容易泄露
        std::unique_ptr<Entity> entity = std::make_unique<Entity>(); // 更安全
        // Created Entity!
        
        // std::unique_ptr<Entity> e0 = entity; // 不允许复制
        entity->Print();
    } // Destroyed Entity!
    std::cin.get();
}
```

## std::shared_ptr和std::weak_ptr

`shared_ptr`常通过**引用计数**实现，跟踪内存的引用数量，一旦减至0就释放该内存。

* `shared_ptr`在创建时会另外分配一个控制块，用来存储引用计数，少量开销
* `shared_ptr`**可以复制**，引用计数不为零而该指针超出作用域时仅会删除该指针，不会释放内存
* 将一个`shared_ptr`复制给`weak_ptr`时，**引用计数不会增加**，即不会保持被引用的对象存活

```c++
int main() {
    {
        std::shared_ptr<Entity> e0;
        {
            std::shared_ptr<Entity> entity = std::make_shared<Entity>();
            // std::shared_ptr<Entity> entity(new Entity()); // Entity内存和控制块需要
            // 两次分配，效率更低
            // Created Entity!
            e0 = entity;
            entity->Print();
        }
    } // Destroyed Entity!
    std::cin.get();
}
```

如果上述`line 3`替换为`std::weak_ptr<Entity> e0;`，那么`Destroyed Entity!`则会在内层作用域结束时立即输出，因为`weak_ptr`不计入引用计数